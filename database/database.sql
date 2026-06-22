

CREATE DATABASE QL_Cuoc_Thi_SV_HVCS;
GO
USE QL_Cuoc_Thi_SV_HVCS;
GO

-- 1. VAITRO – Vai trò của đối tượng
CREATE TABLE VAITRO (
    MaVaiTro  VARCHAR(10)  PRIMARY KEY,
    TenVaiTro NVARCHAR(50) NOT NULL
);

-- 2. KHOA – Các khoa tổ chức cuộc thi
CREATE TABLE KHOA (
    MaKhoa    VARCHAR(10)   PRIMARY KEY,
    TenKhoa   NVARCHAR(100) NOT NULL,
    DienThoai VARCHAR(15)   UNIQUE NOT NULL,
    Email     VARCHAR(100)  UNIQUE NOT NULL
);

-- 3. LOP – Các lớp thuộc khoa
CREATE TABLE LOP (
    MaLop    VARCHAR(10)   PRIMARY KEY,
    TenLop   NVARCHAR(100) NOT NULL,
    MaKhoa   VARCHAR(10),
    NienKhoa VARCHAR(20),
    FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa)
);

-- 4. TAIKHOAN – Tài khoản đăng nhập
CREATE TABLE TAIKHOAN (
    MaTK        VARCHAR(20)  PRIMARY KEY,
    TenDangNhap VARCHAR(50)  UNIQUE NOT NULL,
    MatKhau     VARCHAR(100) NOT NULL,
    TrangThai   NVARCHAR(50),          -- 'Hoạt động' | 'Bị khóa'
    MaVaiTro    VARCHAR(10),
    FOREIGN KEY (MaVaiTro) REFERENCES VAITRO(MaVaiTro)
);

-- 5. SINHVIEN – Sinh viên trong HVCS
CREATE TABLE SINHVIEN (
    MaSV     VARCHAR(10)   PRIMARY KEY,
    HoTen    NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    Email    VARCHAR(100)  UNIQUE NOT NULL,
    SDT      VARCHAR(15)   UNIQUE NOT NULL,
    MaLop    VARCHAR(10),
    MaTK     VARCHAR(20)   UNIQUE,
    FOREIGN KEY (MaLop) REFERENCES LOP(MaLop),
    FOREIGN KEY (MaTK)  REFERENCES TAIKHOAN(MaTK)
);

-- 6. GIANGVIEN – Giảng viên trong HVCS
CREATE TABLE GIANGVIEN (
    MaGV   VARCHAR(10)   PRIMARY KEY,
    HoTen  NVARCHAR(100) NOT NULL,
    Email  VARCHAR(100)  UNIQUE NOT NULL,
    SDT    VARCHAR(15)   UNIQUE NOT NULL,
    MaKhoa VARCHAR(10),
    MaTK   VARCHAR(20)   UNIQUE,

    FOREIGN KEY (MaKhoa)
    REFERENCES KHOA(MaKhoa),

    FOREIGN KEY (MaTK)
    REFERENCES TAIKHOAN(MaTK)
);

-- 7. CUOCTHI – Thông tin cuộc thi
--    + LoaiCuocThi  : Học thuật | NCKH | Khởi nghiệp | Văn nghệ | Thể thao
--    + SoLuongToiDa : Giới hạn số người đăng ký (hiển thị "72/100")
CREATE TABLE CUOCTHI (
    MaCuocThi       VARCHAR(10)   PRIMARY KEY,
    TenCuocThi      NVARCHAR(200) NOT NULL,
    LoaiCuocThi     NVARCHAR(50),           -- Học thuật | NCKH | Khởi nghiệp | Văn nghệ | Thể thao
    DonViToChuc     NVARCHAR(200),
    DiaDiem         NVARCHAR(200),
    ThoiGianBatDau  DATETIME,
    ThoiGianKetThuc DATETIME,
    SoLuongToiDa    INT,                    -- Giới hạn đăng ký
    MoTa            NVARCHAR(500),
    TrangThai       NVARCHAR(50),           -- 'Đang mở' | 'Mở sớm' | 'Sắp đóng' | 'Đã kết thúc'
    MaGV            VARCHAR(10),
    FOREIGN KEY (MaGV) REFERENCES GIANGVIEN(MaGV)
);

-- 8. DANGKY_THAMGIA – Đăng ký tham gia cuộc thi
--    + TrangThaiGV : Xác nhận của Giảng viên (độc lập với CB duyệt)
CREATE TABLE DANGKY_THAMGIA (
    MaDangKy    VARCHAR(10) PRIMARY KEY,
    MaSV        VARCHAR(10),
    MaCuocThi   VARCHAR(10),
    NgayDangKy  DATETIME,
    TrangThaiGV NVARCHAR(50),   -- 'Đã xác nhận' | 'Chờ xác nhận'
    TrangThai   NVARCHAR(50),   -- 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối'
    FOREIGN KEY (MaSV)      REFERENCES SINHVIEN(MaSV),
    FOREIGN KEY (MaCuocThi) REFERENCES CUOCTHI(MaCuocThi)
);
-- 9. KETQUA – Kết quả cuộc thi
CREATE TABLE KETQUA (
    MaKetQua   VARCHAR(10) PRIMARY KEY,
    MaDangKy   VARCHAR(10) UNIQUE,
    XepHang    NVARCHAR(50),
    GiaiThuong NVARCHAR(100),
    Diem       FLOAT,
    FOREIGN KEY (MaDangKy) REFERENCES DANGKY_THAMGIA(MaDangKy)
);

-- 10. THONGBAO – Thông báo về cuộc thi
--     + MaTKNguiGui : Tài khoản gửi thông báo
CREATE TABLE THONGBAO (
    MaThongBao  VARCHAR(10)  PRIMARY KEY,
    TieuDe      NVARCHAR(200),
    NoiDung     NVARCHAR(500),
    NgayGui     DATETIME,
    MaSV        VARCHAR(10),     -- Người nhận (sinh viên)
    MaCuocThi   VARCHAR(10),
    MaTKNguiGui VARCHAR(20),     -- Người gửi
    FOREIGN KEY (MaSV)        REFERENCES SINHVIEN(MaSV),
    FOREIGN KEY (MaCuocThi)   REFERENCES CUOCTHI(MaCuocThi),
    FOREIGN KEY (MaTKNguiGui) REFERENCES TAIKHOAN(MaTK)
);

-- 11. NHATKY – Nhật ký hệ thống
--     Tương ứng màn hình tpl-logs
CREATE TABLE NHATKY (
    MaNhatKy VARCHAR(10)  PRIMARY KEY,
    MaTK     VARCHAR(20),
    ThoiGian DATETIME     DEFAULT GETDATE(),
    HanhDong NVARCHAR(50),   -- 'Đăng ký' | 'Duyệt' | 'Hủy' | 'Cập nhật' | 'Xác nhận'
    MoTa     NVARCHAR(300),
    FOREIGN KEY (MaTK) REFERENCES TAIKHOAN(MaTK)
);

-- 12. PHANQUYEN – Phân quyền chi tiết theo vai trò
--     Tương ứng màn hình tpl-permissions
CREATE TABLE PHANQUYEN (
    MaPhanQuyen VARCHAR(10)  PRIMARY KEY,
    MaVaiTro    VARCHAR(10),
    TenChucNang NVARCHAR(100),   -- 'Duyệt đăng ký' | 'Xem danh sách' | 'CRUD hệ thống'...
    QuyenHan    NVARCHAR(100),   -- 'Toàn quyền' | 'Chỉ đọc' | 'Quản lý cuộc thi'...
    TrangThai   NVARCHAR(20) DEFAULT N'Hoạt động',
    FOREIGN KEY (MaVaiTro) REFERENCES VAITRO(MaVaiTro)
);

GO

--  VIEWS hỗ trợ truy vấn frontend

-- View: Danh sách tham gia kèm Khoa (dùng cho tpl-participants, tpl-registration)
CREATE VIEW VW_DANGKY_CHITIET AS
SELECT
    dk.MaDangKy,
    dk.NgayDangKy,
    dk.TrangThaiGV,
    dk.TrangThai,
    sv.MaSV,
    sv.HoTen      AS TenSinhVien,
    k.TenKhoa,
    ct.MaCuocThi,
    ct.TenCuocThi
FROM DANGKY_THAMGIA dk
JOIN SINHVIEN sv ON dk.MaSV      = sv.MaSV
JOIN LOP       l ON sv.MaLop     = l.MaLop
JOIN KHOA      k ON l.MaKhoa     = k.MaKhoa
JOIN CUOCTHI  ct ON dk.MaCuocThi = ct.MaCuocThi;
GO

-- View: Số lượng đăng ký hiện tại mỗi cuộc thi (hiển thị "72/100")
CREATE VIEW VW_CUOCTHI_SOLUONG AS
SELECT
    ct.MaCuocThi,
    ct.TenCuocThi,
    ct.LoaiCuocThi,
    ct.DiaDiem,
    ct.ThoiGianBatDau,
    ct.ThoiGianKetThuc,
    ct.SoLuongToiDa,
    ct.TrangThai,
    COUNT(dk.MaDangKy) AS SoLuongDaDangKy
FROM CUOCTHI ct
LEFT JOIN DANGKY_THAMGIA dk
       ON ct.MaCuocThi = dk.MaCuocThi
      AND dk.TrangThai <> N'Từ chối'
GROUP BY
    ct.MaCuocThi, ct.TenCuocThi, ct.LoaiCuocThi,
    ct.DiaDiem, ct.ThoiGianBatDau, ct.ThoiGianKetThuc,
    ct.SoLuongToiDa, ct.TrangThai;
GO