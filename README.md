# SGCC WebUI

A simple, secure web-based chat application using React and OpenPGP.js. This project is a reference web frontend implementation for [gpgchatplatform](https://github.com/SessionHu/gpgchatplatform).

## Features

- **End-to-End Encryption:** Using OpenPGP for secure communication.
- **Local Message Storage:** Chats are stored locally in your browser's IndexedDB.
- **Contact Management:** Simple sidebar for managing your contacts.
- **Data Import/Export:** Functionality to import and export user data.
- **Backend Server Switching:** Ability to configure and switch between different backend servers.

## Getting Started

You can download the latest build artifacts directly from the [GitHub Actions page](https://github.com/SessionHu/sgcc-webui/actions).

Alternatively, you can build the project from the source by following the steps below.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/SessionHu/sgcc-webui.git
    cd sgcc-webui
    ```
2.  Install the dependencies:
    ```bash
    yarn
    ```

### Running the Development Server

To start the local development server, run the following command:

```bash
yarn dev
```

### Building for Production

To create a production build, run:

```bash
yarn build
```

The output files will be in the `dist/` directory.

### Linting

To check the code for TypeScript errors, run:

```bash
yarn lint
```

## License

This project is licensed under the **GPL-3.0-or-later**. See the [LICENSE](LICENSE) file for details.
