package com.roadrescue.api.config;

import com.roadrescue.api.entity.Mechanic;
import com.roadrescue.api.entity.User;
import com.roadrescue.api.repository.MechanicRepository;
import com.roadrescue.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MechanicRepository mechanicRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, 
                          MechanicRepository mechanicRepository, 
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.mechanicRepository = mechanicRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Admin
        if (!userRepository.existsByEmail("admin@roadrescue.com")) {
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@roadrescue.com")
                    .password(passwordEncoder.encode("123456"))
                    .phone("+91 9999999999")
                    .role(User.Role.ADMIN)
                    .avatarUrl("https://ui-avatars.com/api/?name=Admin&background=FF6B35&color=fff")
                    .build();
            userRepository.save(admin);
            System.out.println("DatabaseSeeder: Seeded admin account (admin@roadrescue.com).");
        }

        // 2. Seed Driver (Customer)
        if (!userRepository.existsByEmail("driver@roadrescue.com")) {
            User driver = User.builder()
                    .name("Ananya Sharma")
                    .email("driver@roadrescue.com")
                    .password(passwordEncoder.encode("123456"))
                    .phone("+91 9876543210")
                    .role(User.Role.USER)
                    .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60")
                    .build();
            userRepository.save(driver);
            System.out.println("DatabaseSeeder: Seeded driver account (driver@roadrescue.com).");
        }

        // 3. Seed Mechanic
        if (!userRepository.existsByEmail("mechanic@roadrescue.com")) {
            User mechUser = User.builder()
                    .name("Gurpreet Singh")
                    .email("mechanic@roadrescue.com")
                    .password(passwordEncoder.encode("123456"))
                    .phone("+91 8888888888")
                    .role(User.Role.MECHANIC)
                    .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60")
                    .build();
            mechUser = userRepository.save(mechUser);

            Mechanic mechanic = Mechanic.builder()
                    .user(mechUser)
                    .specialty("flat_tire")
                    .experienceYears(8)
                    .rating(4.95)
                    .isOnline(true)
                    .isAvailable(true)
                    .latitude(28.4595) // Center coordinates Gurgaon
                    .longitude(77.0266)
                    .build();
            mechanicRepository.save(mechanic);
            System.out.println("DatabaseSeeder: Seeded mechanic account (mechanic@roadrescue.com) and details.");
        }
    }
}
