# CipherChat - Mini

Minimalistic & Aesthetic CLI Client for Matrix Servers
*Built with Node.js • Low memory footprint • Future Rust port in progress*

---

## ✨ Overview

**CipherChat** is a minimal, aesthetic, and functional CLI tool for interacting with [Matrix](https://matrix.org) servers directly from your terminal. Designed for power users who prefer lightweight, distraction-free communication without sacrificing core features.

This is the **mini version** built with Node.js. A future full version is planned in Rust for even better performance and lower resource usage.

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥18.x-green)](https://nodejs.org/)
[![Matrix](https://img.shields.io/badge/Matrix-Client-blueviolet)](https://matrix.org/)

[![cich CLI Demo](https://img.youtube.com/vi/RKfXgHqtfLk/maxresdefault.jpg)](https://youtu.be/RKfXgHqtfLk)

---

## 🚀 Features

* 🔑 **Authentication** (Login, Signup, Logout)
* 💬 **Room Management** (Join, Leave, Create, List, Fetch Messages)
* 🛠️ **Daemon Mode** for background sync & updates
* 🔐 **End-to-Encryption** for secure communication
* ⚡ **Low memory footprint**
* 🎨 **Minimal, clean terminal interface**
* 📜 **In-chat Commands** for fast operations

---

## 📦 Installation

### **Prerequisites**
- Node.js **≥18.x**
- A Matrix account *(or use `cich auth signup` to create one)*



```bash
npm i -g https://github.com/neon-x-hub/cipher-chat-mini.git
```
(Different Builds for OSs soon...)

---

## 📝 Usage

```bash
cich [options] [command]
```

Minimal, Aesthetic CLI for Matrix.

### Global Options

| Option          | Description                            |
| --------------- | -------------------------------------- |
| `-V, --version` | Output the version number              |
| `-d, --debug`   | Enable debug mode (default: false)     |
| `-v, --verbose` | Enable verbose output (default: false) |
| `-h, --help`    | Display help for command               |

---

## 🔐 Authentication Commands

```bash
cich auth [command]
```

| Command  | Description               |
| -------- | ------------------------- |
| `login`  | Log in via password/token |
| `signup` | Sign up for a new account |
| `logout` | Clear session             |

---

## 🏠 Room Management Commands

```bash
cich room [command]
```

| Command                       | Description                             |
| ----------------------------- | --------------------------------------- |
| `join <room-identifier>`      | Join a Matrix room by ID or alias       |
| `leave <roomId>`              | Exit a room                             |
| `create [options]`            | Create a new Matrix room                |
| `list [options]`              | Show rooms (joined by default)          |
| `messages <roomId> [options]` | Fetch messages from a room (with range) |

---

## ⚙️ Daemon Management Commands

```bash
cich daemon [command]
```

| Command   | Description                |
| --------- | -------------------------- |
| `start`   | Start the daemon           |
| `stop`    | Stop the daemon            |
| `disable` | Disable the daemon         |
| `enable`  | Enable the daemon          |
| `state`   | Check the daemon state     |
| `config`  | View current daemon config |


---

## 💬 In-Chat Commands

Once inside a chat session, use the following:

| Command                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `/help`                | Show available commands                              |
| `/clear`               | Clear the chat history                               |
| `/exit`                | Exit the chat                                        |
| `/error`               | Simulate an error (for fun/debugging)                |
| `/history <from> <to>` | Fetch chat history (e.g., `/history 2d now`)         |
| `/sync <since>`        | Sync messages from a point to now (e.g., `/sync 2d`) |

---

## 🔮 Roadmap

* [ ] **Rust Version**: Full rewrite in Rust for ultra-fast performance
* [ ] **Better Theming & Color Customization**
* [ ] **Plugin/Extension System**
* [ ] **Offline Mode**
* [ ] **Refactor the source code further**

---

## 📈 Performance

CipherChat is designed to maintain a **low memory footprint** even in the Node.js version. The planned Rust version will further reduce resource consumption while improving speed and concurrency.

---

## 🤝 Contributing

PRs, issues, and feature suggestions are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

* [Matrix.org](https://matrix.org) — Open network for secure, decentralized communication
* [Commander.js](https://github.com/tj/commander.js) — For CLI command parsing
* Node.js community for the ecosystem

---

## ❤️ Stay Tuned

Follow the project for updates on the Rust version and new features!
Future plans include making CipherChat the **fastest, minimalistic Matrix client** out there.
