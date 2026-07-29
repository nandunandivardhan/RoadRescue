/**
 * ChatScreen — Real-time communication between Customer and Mechanic
 */
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useUserStore from '../../store/useUserStore';
import useChatStore from '../../store/useChatStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';

const ChatScreen = ({ navigation, route }) => {
  const { requestId, recipientName } = route.params;
  const { profile } = useUserStore();
  const { messages, listenToMessages, sendMessage, cleanupChat } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef();
  const [recipientPhone, setRecipientPhone] = useState('');

  useEffect(() => {
    const unsub = listenToMessages(requestId);
    return () => cleanupChat();
  }, [requestId]);

  useEffect(() => {
    // 1. Listen to request doc to find the other user's ID
    const unsubRequest = onSnapshot(doc(db, 'requests', requestId), (docSnap) => {
      if (docSnap.exists()) {
        const reqData = docSnap.data();
        const otherUserId = profile.role === 'customer' ? reqData.mechanicId : reqData.customerId;
        const fallbackPhone = profile.role === 'customer' ? reqData.mechanicPhone : reqData.customerPhone;
        
        if (otherUserId) {
          // 2. Listen to the other user's user document for real-time phone number updates!
          const unsubUser = onSnapshot(doc(db, 'users', otherUserId), (userSnap) => {
            if (userSnap.exists()) {
              const uData = userSnap.data();
              setRecipientPhone(uData.phone || uData.phoneNumber || fallbackPhone || '');
            } else {
              setRecipientPhone(fallbackPhone || '');
            }
          });
          return () => unsubUser();
        } else {
          setRecipientPhone(fallbackPhone || '');
        }
      }
    });
    
    return () => unsubRequest();
  }, [requestId, profile.uid, profile.role]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const textToSend = inputText;
    setInputText('');

    await sendMessage(requestId, {
      text: textToSend,
      senderId: profile.uid,
      senderName: profile.name,
    });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === profile.uid;

    return (
      <View style={[s.messageContainer, isMe ? s.myMessage : s.theirMessage]}>
        <View style={[s.bubble, isMe ? s.myBubble : s.theirBubble]}>
          <Text style={[s.messageText, isMe ? s.myText : s.theirText]}>
            {item.text}
          </Text>
          <Text style={[s.timeText, isMe ? s.myTime : s.theirTime]}>
            {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <View style={s.avatar}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={s.userName}>{recipientName || 'RoadRescue Help'}</Text>
            <Text style={s.userStatus}>Online</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={s.callBtn} 
          onPress={() => {
            if (recipientPhone) {
              Linking.openURL(`tel:${recipientPhone}`);
            } else {
              Alert.alert('Unavailable', 'Phone number is not available.');
            }
          }}
          disabled={!recipientPhone}
        >
          <MaterialCommunityIcons name="phone" size={22} color={recipientPhone ? COLORS.primary : COLORS.border} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={s.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <View style={s.inputContainer}>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.input}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]} 
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialCommunityIcons name="send" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 50, 
    paddingBottom: 15, 
    paddingHorizontal: SIZES.md, 
    backgroundColor: COLORS.surface,
    ...SHADOWS.small 
  },
  backBtn: { padding: 5 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: SIZES.sm },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.primaryGhost, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: SIZES.md 
  },
  userName: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.semiBold },
  userStatus: { fontSize: SIZES.tiny, color: COLORS.success, ...FONTS.medium },
  callBtn: { padding: 8, backgroundColor: COLORS.primaryGhost, borderRadius: 12 },
  listContent: { padding: SIZES.md, paddingBottom: 20 },
  messageContainer: { marginBottom: SIZES.md, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  bubble: { padding: SIZES.md, borderRadius: 20 },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, ...SHADOWS.small },
  messageText: { fontSize: SIZES.bodySmall, lineHeight: 20, ...FONTS.regular },
  myText: { color: '#FFF' },
  theirText: { color: COLORS.textPrimary },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  theirTime: { color: COLORS.textTertiary },
  inputContainer: { 
    padding: SIZES.md, 
    backgroundColor: COLORS.surface, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.borderLight 
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F0F2F5', borderRadius: 24, paddingHorizontal: SIZES.md, paddingVertical: 8 },
  input: { flex: 1, maxHeight: 100, fontSize: SIZES.bodySmall, color: COLORS.textPrimary, paddingVertical: 5 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: SIZES.sm },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});

export default ChatScreen;
