# 🚀 FlowGuard DPI Engine - Multi-Threaded Deep Packet Inspection System

FlowGuard DPI Engine is a high-performance **Deep Packet Inspection (DPI)** and **network traffic classification system** built in modern C++.
The project analyzes network packets from PCAP captures, extracts application-level metadata such as TLS SNI domains, classifies traffic into applications (YouTube, Facebook, Google, etc.), and applies real-time filtering and blocking rules.

It demonstrates concepts used in enterprise-grade firewalls, ISP traffic monitoring systems, and cybersecurity appliances.

---

# 🌟 Core Features

## 📦 PCAP Packet Processing

* Reads and processes `.pcap` packet capture files
* Parses raw Ethernet, IPv4, TCP, and UDP packets
* Supports offline packet analysis using Wireshark captures
* Handles packet metadata such as timestamps and packet lengths

---

## 🔍 Deep Packet Inspection (DPI)

* Performs Layer-7 traffic inspection
* Extracts **TLS Server Name Indication (SNI)** from HTTPS traffic
* Extracts HTTP Host headers from plaintext HTTP requests
* Identifies application traffic from packet payloads
* Detects encrypted traffic destinations without decrypting HTTPS

---

## 🌐 Application Traffic Classification

Automatically classifies traffic into applications such as:

* YouTube
* Facebook
* Google
* GitHub
* DNS
* HTTPS
* HTTP
* Unknown traffic

Traffic classification is based on:

* SNI domain matching
* HTTP Host header analysis
* Port and protocol inspection

---

## 🚫 Intelligent Traffic Blocking

Supports multiple blocking mechanisms:

### App-Based Blocking

* Block entire applications like:

  * YouTube
  * TikTok
  * Facebook

### Domain-Based Blocking

* Block domains using substring matching
* Example:

  * `facebook`
  * `tiktok`
  * `youtube`

### IP-Based Blocking

* Block traffic from specific IP addresses
* Useful for blacklist enforcement

### Flow-Based Blocking

* Once a connection is identified as blocked, all future packets of that flow are automatically dropped
* Stateful connection tracking using Five-Tuple flow identification

---

## ⚡ Multi-Threaded Processing Architecture

The engine includes a scalable parallel processing pipeline:

### Reader Thread

* Reads packets from PCAP files

### Load Balancer Threads

* Distributes packets across processing threads
* Uses hash-based flow assignment

### Fast Path (FP) Threads

* Performs packet classification and rule checks
* Maintains independent flow tables

### Output Writer Thread

* Writes forwarded packets into filtered PCAP output

### Thread-Safe Queues

* Producer-consumer architecture using:

  * Mutexes
  * Condition variables
  * Thread synchronization

---

## 🔄 Flow Tracking System

Tracks every network flow using the Five-Tuple:

* Source IP
* Destination IP
* Source Port
* Destination Port
* Protocol

This allows:

* Stateful packet inspection
* Consistent connection handling
* Accurate blocking of complete sessions

---

## 📊 Traffic Analytics & Reporting

Generates detailed processing reports including:

* Total packets processed
* TCP vs UDP statistics
* Forwarded vs dropped packets
* Application breakdown percentages
* Detected domains/SNIs
* Thread workload distribution

---

# 🏗️ System Architecture

```text
PCAP Input
     │
     ▼
┌──────────────────┐
│  Reader Thread   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Load Balancers   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Fast Path Threads│
│ - DPI            │
│ - Classification │
│ - Blocking       │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Output Writer    │
└────────┬─────────┘
         ▼
Filtered PCAP Output
```

---

# 🛠️ Technology Stack

## Core Technologies

* **C++17** – Core system implementation
* **Multi-threading** – Parallel packet processing
* **PCAP File Processing** – Network capture analysis
* **Modern STL Containers** – Efficient data handling

---

## Networking Concepts Used

* Ethernet Frame Parsing
* IPv4 Packet Parsing
* TCP/UDP Header Processing
* TLS Client Hello Inspection
* HTTP Header Extraction
* Stateful Flow Tracking
* Deep Packet Inspection (DPI)

---

## Concurrency & Systems Programming

* std::thread
* std::mutex
* std::condition_variable
* Producer-Consumer Queues
* Thread Synchronization
* Parallel Processing Pipelines

---

# 📂 Project Structure

```text
packet_analyzer/
│
├── include/
│   ├── pcap_reader.h
│   ├── packet_parser.h
│   ├── sni_extractor.h
│   ├── rule_manager.h
│   ├── connection_tracker.h
│   ├── load_balancer.h
│   ├── fast_path.h
│   ├── thread_safe_queue.h
│   └── dpi_engine.h
│
├── src/
│   ├── main_working.cpp
│   ├── dpi_mt.cpp
│   ├── pcap_reader.cpp
│   ├── packet_parser.cpp
│   ├── sni_extractor.cpp
│   └── types.cpp
│
├── test_dpi.pcap
├── generate_test_pcap.py
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* g++ / clang++
* C++17 compatible compiler
* Python 3 (optional for test PCAP generation)
* Linux/macOS environment

---

# ⚙️ Build Instructions

## Single-Threaded Version

```bash
g++ -std=c++17 -O2 -I include -o dpi_simple \
src/main_working.cpp \
src/pcap_reader.cpp \
src/packet_parser.cpp \
src/sni_extractor.cpp \
src/types.cpp
```

---

## Multi-Threaded Version

```bash
g++ -std=c++17 -pthread -O2 -I include -o dpi_engine \
src/dpi_mt.cpp \
src/pcap_reader.cpp \
src/packet_parser.cpp \
src/sni_extractor.cpp \
src/types.cpp
```

---

# ▶️ Running the Engine

## Basic Usage

```bash
./dpi_engine test_dpi.pcap output.pcap
```

---

## With Blocking Rules

```bash
./dpi_engine test_dpi.pcap output.pcap \
--block-app YouTube \
--block-app TikTok \
--block-domain facebook \
--block-ip 192.168.1.50
```

---

## Configure Thread Counts

```bash
./dpi_engine input.pcap output.pcap --lbs 4 --fps 4
```

Creates:

* 4 Load Balancer Threads
* 16 Fast Path Processing Threads

---

# 🧠 Key Concepts Demonstrated

## Deep Packet Inspection

Inspects packet payloads beyond standard headers.

## TLS SNI Extraction

Extracts destination domains from encrypted HTTPS handshakes.

## Stateful Flow Tracking

Maintains connection state using Five-Tuple identification.

## Parallel Systems Design

Implements scalable packet processing pipelines.

## Thread Synchronization

Uses thread-safe queues for producer-consumer communication.

## Network Protocol Parsing

Processes Ethernet, IPv4, TCP, UDP, and TLS packets manually.

---

# 📈 Sample Output

```text
[Rules] Blocked app: YouTube
[Rules] Blocked domain: facebook

Total Packets: 77
Forwarded: 69
Dropped: 8

Application Breakdown:
- HTTPS
- YouTube (BLOCKED)
- Facebook
- DNS
- Google
```

---

# 🔧 Future Improvements

* QUIC / HTTP3 support
* Live traffic capture support
* Real-time monitoring dashboard
* Bandwidth throttling
* Rule persistence system
* Machine learning-based traffic classification
* Intrusion detection integration
* Real-time packet visualization

---

# 🎯 Learning Outcomes

This project demonstrates practical understanding of:

* Computer Networks
* Cybersecurity
* Deep Packet Inspection
* Operating Systems
* Multi-threading
* Systems Programming
* Network Traffic Analysis
* Parallel Computing
* Stateful Firewall Design

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to your branch

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

# 📚 Project Inspiration

This project is inspired by concepts used in:

* Enterprise Firewalls
* ISP Traffic Management Systems
* Network Monitoring Appliances
* Cybersecurity DPI Engines
* Stateful Packet Inspection Systems

---

# 📌 Author

Developed as a systems and networking project focused on:

* Deep Packet Inspection
* High-performance packet processing
* Multi-threaded architecture
* Real-world network security concepts

Based on the uploaded DPI project documentation. 
 
 
 
