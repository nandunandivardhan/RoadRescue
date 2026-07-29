# RoadRescue Enterprise Backend

## 🚀 Overview
This is a production-grade Java Spring Boot backend for the **RoadRescue** platform. It implements a layered architecture, secure JWT authentication, and high-performance spatial querying for real-time roadside assistance.

## 🛠️ Tech Stack
- **Java 17**
- **Spring Boot 3.2.5**
- **Spring Security & JWT** (Stateless authentication)
- **Spring Data JPA**
- **MySQL 8.0**
- **Lombok**
- **Maven**

## 🏗️ Architecture
The project follows the **Layered Architecture** pattern:
- **Controller Layer**: REST endpoints for mobile and web clients.
- **Service Layer**: Core business logic (Mechanic allocation, status management).
- **Repository Layer**: Data access using Spring Data JPA with custom native queries for Geo-Spatial calculations.
- **Entity Layer**: JPA mappings for relational data.
- **Security Layer**: Custom JWT filters and role-based authorization (USER, MECHANIC, ADMIN).

## 🔑 Key Features
- **Stateless JWT Auth**: Secure login/signup for all roles.
- **Haversine Spatial Query**: Efficiently locate mechanics within a radius using advanced SQL.
- **Global Exception Handling**: Structured JSON error responses.
- **Validation**: Strict request data validation using `@Valid`.

## ⚙️ Setup Instructions
1.  **Database**: Create a MySQL database named `roadrescue`.
2.  **Configuration**: Update `src/main/resources/application.properties` with your MySQL credentials.
3.  **Run**:
    ```bash
    mvn clean install
    mvn spring-boot:run
    ```

## 📜 API Documentation
- `POST /api/auth/register` - Create new account.
- `POST /api/auth/login` - Obtain JWT token.
- `GET /api/mechanics/nearby` - Find mechanics by lat/lng.
- `POST /api/requests/create` - Open a new service request.
- `PUT /api/requests/status/{id}` - Update job status (Mechanic only).
