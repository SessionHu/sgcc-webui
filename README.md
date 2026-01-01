# SGCC WebUI

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/SessionHu/sgcc-webui/ci.yml?style=flat-square&link=https%3A%2F%2Fgithub.com%2FSessionHu%2Fsgcc-webui%2Factions%2Fworkflows%2Fci.yml)
![GitHub License](https://img.shields.io/github/license/SessionHu/sgcc-webui?style=flat-square&link=https%3A%2F%2Fgithub.com%2FSessionHu%2Fsgcc-webui%2Fblob%2Fmaster%2FLICENSE)
![GitHub top language](https://img.shields.io/github/languages/top/SessionHu/sgcc-webui?style=flat-square&link=https%3A%2F%2Fgithub.com%2FSessionHu%2Fsgcc-webui)
![GitHub repo size](https://img.shields.io/github/repo-size/SessionHu/sgcc-webui?style=flat-square&link=https%3A%2F%2Fgithub.com%2FSessionHu%2Fsgcc-webui)


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

## Disclaimer

This software is provided "AS IS" without warranty. This software relies on third-party libraries; we are not responsible for their security vulnerabilities. Users are solely responsible for their actions and must comply with all applicable laws.

## Privacy

This is free software. You are encouraged to audit the source code to verify its privacy practices. All data is stored locally on your device.

## License

This project is licensed under the **GPL-3.0-or-later**. See the [LICENSE](LICENSE) file for details.
