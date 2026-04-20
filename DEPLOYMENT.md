# Hướng Dẫn Triển Khai (Deployment Instructions) - Cập Nhật

Tài liệu này cung cấp hướng dẫn triển khai hệ thống **LAN Control System** lên VPS Linux sử dụng Docker Compose. Đã được cập nhật triệt để để hỗ trợ tính năng **LAN Discovery** (quét mạng LAN) thông qua `network_mode: "host"`. Theo nguyên tắc cốt lõi: *"Luôn viết hướng dẫn triển khai khi cung cấp giải pháp hoặc viết code."*

## Yêu Cầu Hệ Thống
- VPS Linux có quyền sudo hoặc user đã ở trong group `docker` (VD: `hitpro`). Bạn có thể gán quyền bằng lệnh: `sudo usermod -aG docker <username>`.
- Đã cài đặt Docker và Docker Compose Plugin v2 (`docker-compose-plugin`).
- Hệ thống hỗ trợ chế độ mạng `host` (lưu ý macOS/Windows Docker Desktop không hỗ trợ hoàn toàn `host` mode, nên cài đặt này tối ưu nhất trên Native Linux VPS).

## Các Bước Triển Khai

### 1. Đồng Bộ Mã Nguồn
Tải mã nguồn lên thư mục đích trên VPS:
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@<IP_VPS>:/path/to/project
```
> **Tip:** Quá trình tự động hoá đã được làm sẵn trong file `.agent/scripts/auto_deploy.js` để đẩy code và tự động build thông qua `node-ssh` trực tiếp từ máy cục bộ.

### 2. Cơ Chế Mạng (Networking) & Network Tools
Dự án sử dụng `network_mode: "host"` cho cả `app` và `tunnel` để container Node.js có quyền truy cập trực tiếp vào Card mạng vật lý của VPS. Nếu chạy ở chế độ bridge, ARP request sẽ không thể bay ra ngoài mạng LAN. Dockerfile cũng đã tự động cài đặt `arp-scan`, `iproute2` và `nmap` vào môi trường chứa ứng dụng để đáp ứng mã nguồn ở `lanScanner.js`.

### 3. Build và Start Container
Tại thư mục chứa dự án trên VPS, chạy lệnh:
```bash
docker compose up -d --build
```
> **Lưu ý cực kỳ quan trọng**: Phải dùng `docker compose` (v2 plugin có sẵn ở bản docker mới) thay vì `docker-compose` (v1 python pip). Nếu dùng bản cũ sẽ gây ra lỗi `KeyError: 'ContainerConfig'` do đụng độ chuẩn format build mới.

### 4. Kiểm Tra & Quản Trị Hệ Thống
- **Kiểm tra hiển thị Logs**: `docker compose logs -f app`
- **Khởi động lại (Restart)**: `docker compose restart`
- **Dừng hệ thống / Xoá Containers**: `docker compose down`
- Mở URL trên trình duyệt: Truy cập `http://<IP_VPS_LAN>:3000`. Khi tải danh sách thiết bị, Backend lúc này mới thực sự scan được toàn dải mạng LAN thực sự của VPS qua `arp-scan`!
