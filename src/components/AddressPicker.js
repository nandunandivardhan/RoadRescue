/**
 * AddressPicker — Smart Google Places Auto-complete
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../utils/theme';
import { geocodeAddress } from '../services/googleMaps';

const GOOGLE_API_KEY = "AIzaSyC1ISFk-MLFBI4TSTinyZAzbBW4mWM9vAE";

const AddressPicker = ({ onLocationSelected, currentAddress = '' }) => {
  const [query, setQuery] = useState(currentAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimer = useRef(null);

  const handleManualSearch = async () => {
    if (query.length < 3) return;
    setIsLoading(true);
    try {
      const coords = await geocodeAddress(query);
      if (coords) {
        onLocationSelected({
          ...coords,
          address: query
        });
        setShowSuggestions(false);
      } else {
        Alert.alert('Location Not Found', 'We could not find coordinates for this address. Please be more specific.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setQuery(currentAddress);
  }, [currentAddress]);

  const searchPlaces = async (text) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}&types=geocode`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Place search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setQuery(text);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    
    typingTimer.current = setTimeout(() => {
      searchPlaces(text);
    }, 500); // Debounce search
  };

  const handleSelect = async (placeId, description) => {
    console.log('Selected place:', description, 'ID:', placeId);
    setQuery(description);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Get Lat/Lng for the selected place
    try {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(detailUrl);
      const data = await response.json();
      
      console.log('Place Details API Status:', data.status);

      if (data.status === 'OK') {
        const { lat, lng } = data.result.geometry.location;
        console.log('Fetched Coordinates:', lat, lng);
        
        onLocationSelected({
          latitude: lat,
          longitude: lng,
          address: description
        });
      } else {
        Alert.alert('Location Error', 'Could not get coordinates for this place. Please try another.');
      }
    } catch (error) {
      console.error('Place detail error:', error);
      Alert.alert('Error', 'Something went wrong while fetching location details.');
    }
  };

  return (
    <View style={s.container}>
      <View style={s.inputWrapper}>
        <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} style={s.icon} />
        <TextInput
          style={s.input}
          placeholder="Enter pickup location..."
          value={query}
          onChangeText={handleInputChange}
          onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          returnKeyType="search"
          onSubmitEditing={handleManualSearch}
        />
        {isLoading && <ActivityIndicator size="small" color={COLORS.primary} style={s.loader} />}
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {query.length > 0 && (
            <>
              <TouchableOpacity onPress={handleManualSearch} style={{ marginRight: 8 }}>
                <MaterialCommunityIcons name="magnify" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={s.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            ListHeaderComponent={<Text style={s.headerText}>Select Location</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={s.suggestionItem} 
                onPress={() => handleSelect(item.place_id, item.description)}
              >
                <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.textTertiary} />
                <View style={s.suggestionTextContainer}>
                  <Text style={s.mainText} numberOfLines={1}>{item.structured_formatting.main_text}</Text>
                  <Text style={s.subText} numberOfLines={1}>{item.structured_formatting.secondary_text}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { zIndex: 1000, width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: SIZES.md,
    height: 56,
    ...SHADOWS.medium
  },
  icon: { marginRight: SIZES.sm },
  input: { flex: 1, fontSize: SIZES.bodySmall, color: COLORS.textPrimary, ...FONTS.medium },
  loader: { marginRight: SIZES.sm },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: 250,
    ...SHADOWS.large,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  suggestionTextContainer: { marginLeft: SIZES.md, flex: 1 },
  mainText: { fontSize: SIZES.bodySmall, color: COLORS.textPrimary, ...FONTS.semiBold },
  subText: { fontSize: SIZES.tiny, color: COLORS.textTertiary, ...FONTS.regular, marginTop: 2 },
  headerText: { fontSize: 10, color: COLORS.textTertiary, ...FONTS.bold, padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', letterSpacing: 0.5, textTransform: 'uppercase' },
});

export default AddressPicker;
