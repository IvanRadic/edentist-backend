# eDentist Backend

This project is the backend for the eDentist application, designed to manage dental clinic operations efficiently.

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js
- MySQL

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/IvanRadic/edentist-backend.git
   ```
2. Install NPM packages
   ```sh
   yarn install
   ```
3. Copy `.env.example` to `.env` and update the environment variables according to your setup
   ```sh
   cp .env.example .env
   ```
4. Run the development server
   ```sh
   yarn run dev
   ```

## Usage

This backend serves as the core for the eDentist application, handling user authentication, profile management, scheduling, and more. It's designed to be consumed by a frontend application or other services through its RESTful API.

## Documentation

API documentation is available at `/api-docs` endpoint after running the server, providing detailed information about the available endpoints, their parameters, and expected responses.

<img width="946" alt="SwaggerDocs" src="https://github.com/IvanRadic/edentist-backend/assets/26674229/6ae3ac61-f381-4fb4-b211-c69873b3aeec">


## License

Distributed under the MIT License.

## Contact
LinkedIn Profile Link - www.linkedin.com/in/ivan-radic

Project Link - https://github.com/IvanRadic/edentist-backend.git

## Dependencies

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)
