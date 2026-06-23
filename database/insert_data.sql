-- =========================================================
--  02_data.sql
--  QL_Cuoc_Thi_SV_HVCS – Dữ liệu mẫu
--  Chạy file này SAU khi đã chạy 01_schema.sql
--  Thứ tự INSERT phải theo đúng thứ tự khóa ngoại:
--  VAITRO → KHOA → LOP → TAIKHOAN → SINHVIEN / GIANGVIEN
--  → CUOCTHI → DANGKY_THAMGIA → KETQUA
--  → THONGBAO → NHATKY → PHANQUYEN
-- =========================================================

USE QL_Cuoc_Thi_SV_HVCS;
GO

-- ---------------------------------------------------------
-- 1. VAITRO
-- ---------------------------------------------------------
INSERT INTO VAITRO (MaVaiTro, TenVaiTro) VALUES
    ('admin', N'Quản trị viên'),
    ('cb',    N'Cán bộ quản lý'),
    ('gv',    N'Giảng viên'),
    ('sv',    N'Sinh viên'),
    ('guest', N'Khách');

-- ---------------------------------------------------------
-- 2. KHOA
--    Các đơn vị này sẽ xuất hiện trong dropdown "Đơn vị tổ chức"
--    (ngoài option mặc định "HVCS" được thêm cứng ở frontend)
-- ---------------------------------------------------------
INSERT INTO KHOA (MaKhoa, TenKhoa, DienThoai, Email) VALUES
    ('CNTT',  N'Khoa CNTT',                '0241000001', 'cntt@hvcs.edu.vn'),
    ('KT',    N'Khoa Kinh tế',             '0241000002', 'kinhte@hvcs.edu.vn'),
    ('CK',    N'Khoa Cơ khí',              '0241000003', 'cokhi@hvcs.edu.vn'),
    ('VHNT',  N'Khoa Văn hóa - Nghệ thuật','0241000004', 'vhnt@hvcs.edu.vn'),
    ('QTKD',  N'Khoa Quản trị kinh doanh', '0241000005', 'qtkd@hvcs.edu.vn');

-- Đơn vị ngoài khoa (thêm vào bảng KHOA để dropdown hiển thị đủ lựa chọn)
INSERT INTO KHOA (MaKhoa, TenKhoa, DienThoai, Email) VALUES
    ('KHCN',  N'Phòng KHCN',   '0241000006', 'khcn@hvcs.edu.vn'),
    ('DOAN',  N'Đoàn TN',      '0241000007', 'doan@hvcs.edu.vn'),
    ('HOISV', N'Hội SV',       '0241000008', 'hoisv@hvcs.edu.vn'),
    ('CTCT',  N'Phòng CTCT',   '0241000009', 'ctct@hvcs.edu.vn');

-- ---------------------------------------------------------
-- 3. LOP
-- ---------------------------------------------------------
INSERT INTO LOP (MaLop, TenLop, MaKhoa, NienKhoa) VALUES
    ('CNTT21A', N'CNTT K21A',    'CNTT', '2021-2025'),
    ('CNTT22A', N'CNTT K22A',    'CNTT', '2022-2026'),
    ('KT21A',   N'Kinh tế K21A', 'KT',   '2021-2025'),
    ('CK20A',   N'Cơ khí K20A',  'CK',   '2020-2024'),
    ('QTKD21A', N'QTKD K21A',    'QTKD', '2021-2025');

-- ---------------------------------------------------------
-- 4. TAIKHOAN
-- ---------------------------------------------------------
INSERT INTO TAIKHOAN (MaTK, TenDangNhap, MatKhau, TrangThai, MaVaiTro) VALUES
    ('TK001', 'admin',      '1', N'Hoạt động', 'admin'),
    ('TK002', 'cb',         '1', N'Hoạt động', 'cb'),
    ('TK003', 'gv',         '1', N'Hoạt động', 'gv'),
    ('TK004', 'sv21001',    '1', N'Bị khóa',   'sv'),
    ('TK005', 'sv21042',    '1', N'Hoạt động', 'sv'),
    ('TK006', 'sv20087',    '1', N'Hoạt động', 'sv'),
    ('TK007', 'sv22015',    '1', N'Hoạt động', 'sv'),
    ('TK008', 'sv21099',    '1', N'Hoạt động', 'sv'),
    ('TK009', 'cb.phongdt', '1', N'Hoạt động', 'cb'),
    ('TK010', 'gv.nguyen',  '1', N'Hoạt động', 'gv');

-- ---------------------------------------------------------
-- 5. SINHVIEN
-- ---------------------------------------------------------
INSERT INTO SINHVIEN (MaSV, HoTen, NgaySinh, GioiTinh, Email, SDT, MaLop, MaTK) VALUES
    ('SV21001', N'Nguyễn Văn An',  '2003-05-10', N'Nam', 'an.nv21001@hvcs.edu.vn',    '0901000001', 'CNTT21A', 'TK004'),
    ('SV21042', N'Trần Thị Bình',  '2003-08-22', N'Nữ',  'binh.tt21042@hvcs.edu.vn',  '0901000002', 'KT21A',   'TK005'),
    ('SV20087', N'Lê Minh Cường',  '2002-03-15', N'Nam', 'cuong.lm20087@hvcs.edu.vn', '0901000003', 'CK20A',   'TK006'),
    ('SV22015', N'Phạm Thu Dung',  '2004-11-30', N'Nữ',  'dung.pt22015@hvcs.edu.vn',  '0901000004', 'CNTT22A', 'TK007'),
    ('SV21099', N'Hoàng Văn Em',   '2003-07-05', N'Nam', 'em.hv21099@hvcs.edu.vn',    '0901000005', 'QTKD21A', 'TK008');

-- ---------------------------------------------------------
-- 6. GIANGVIEN
-- ---------------------------------------------------------
INSERT INTO GIANGVIEN (MaGV, HoTen, Email, SDT, MaKhoa, MaTK) VALUES
    ('GV001', N'Lê Văn Giảng', 'gv.nguyen@hvcs.edu.vn',  '0911000001', 'CNTT', 'TK010'),
    ('GV002', N'Trần Đào Tạo', 'cb.phongdt@hvcs.edu.vn', '0911000002', 'KT',   'TK009'),
    ('GV003', N'Lê Quốc Huy',  'gv.qhuy@hvcs.edu.vn',   '0911000003', 'CK',   'TK002'),
    ('GV004', N'Lưu Tấn Phát', 'gv.tphat@hvcs.edu.vn',  '0911000004', 'QTKD', 'TK003');

-- ---------------------------------------------------------
-- 7. CUOCTHI
--    DonViToChuc phải khớp TenKhoa trong bảng KHOA
--    (hoặc "HVCS" – giá trị mặc định của dropdown)
-- ---------------------------------------------------------
INSERT INTO CUOCTHI (MaCuocThi, TenCuocThi, LoaiCuocThi, DonViToChuc, DiaDiem,
                     ThoiGianBatDau, ThoiGianKetThuc, SoLuongToiDa, MoTa, TrangThai, MaGV) VALUES
    ('CT001', N'Olympic Tin học 2025', N'Học thuật',   N'Khoa CNTT',  N'Hội trường A', '2025-05-25 08:00','2025-05-25 17:00',100, N'Cuộc thi Olympic Tin học thường niên', N'Đã kết thúc','GV001'),
    ('CT002', N'NCKH Sinh viên 2025',  N'NCKH',        N'Phòng KHCN', N'Phòng B201',  '2025-06-02 08:00','2025-06-02 17:00',100, N'Nghiên cứu khoa học sinh viên 2025',   N'Đã kết thúc','GV001'),
    ('CT003', N'Khởi nghiệp Startup',  N'Khởi nghiệp', N'Đoàn TN',   N'Online',        '2026-08-10 08:00','2026-08-10 17:00', 80, N'Cuộc thi ý tưởng khởi nghiệp',         N'Mở sớm',    'GV002'),
    ('CT004', N'Văn nghệ Xuân 2025',   N'Văn nghệ',    N'Hội SV',    N'Sân khấu lớn', '2025-04-15 18:00','2025-04-15 22:00',120, N'Hội diễn văn nghệ chào xuân',           N'Đã kết thúc','GV002'),
    ('CT005', N'Thể thao học kỳ 2',    N'Thể thao',    N'Phòng CTCT',N'Sân vận động', '2026-09-20 07:00','2026-09-20 17:00',200, N'Hội thao sinh viên học kỳ 2',           N'Mở sớm',    'GV001');

-- ---------------------------------------------------------
-- 8. DANGKY_THAMGIA
-- ---------------------------------------------------------
INSERT INTO DANGKY_THAMGIA (MaDangKy, MaSV, MaCuocThi, NgayDangKy, TrangThaiGV, TrangThai) VALUES
    ('DK001', 'SV21001', 'CT001', '2025-05-18 09:12', N'Đã xác nhận',  N'Chờ duyệt'),
    ('DK002', 'SV21042', 'CT003', '2025-05-17 14:30', N'Chờ xác nhận', N'Chờ duyệt'),
    ('DK003', 'SV20087', 'CT002', '2025-05-16 10:00', N'Đã xác nhận',  N'Đã duyệt'),
    ('DK004', 'SV22015', 'CT001', '2025-05-16 11:45', N'Đã xác nhận',  N'Chờ duyệt'),
    ('DK005', 'SV21099', 'CT003', '2025-05-15 11:30', N'Chờ xác nhận', N'Từ chối'),
    ('DK006', 'SV21001', 'CT004', '2025-04-01 08:00', N'Đã xác nhận',  N'Đã duyệt'),
    ('DK007', 'SV21042', 'CT002', '2025-05-14 09:00', N'Chờ xác nhận', N'Chờ duyệt');

-- ---------------------------------------------------------
-- 9. KETQUA
-- ---------------------------------------------------------
INSERT INTO KETQUA (MaKetQua, MaDangKy, XepHang, GiaiThuong, Diem) VALUES
    ('KQ001', 'DK003', N'Nhất', N'Giải Nhất – 5.000.000đ', 95.0),
    ('KQ002', 'DK006', N'Nhì',  N'Giải Nhì – 3.000.000đ',  88.5),
    ('KQ003', 'DK004', N'Ba',   N'Giải Ba – 2.000.000đ',   82.0);

-- ---------------------------------------------------------
-- 10. THONGBAO
-- ---------------------------------------------------------
INSERT INTO THONGBAO (MaThongBao, TieuDe, NoiDung, NgayGui, MaSV, MaCuocThi, MaTKNguiGui) VALUES
    ('TB001', N'Đăng ký chờ duyệt',
              N'47 đăng ký chờ xét duyệt từ tuần trước. Cần xử lý trước 30/05.',
              '2025-05-18 08:00', NULL,       'CT001', 'TK001'),
    ('TB002', N'Sao lưu hoàn tất',
              N'Sao lưu dữ liệu tự động hoàn tất lúc 02:00 SA.',
              '2025-05-18 02:00', NULL,        NULL,   'TK001'),
    ('TB003', N'Kết quả Olympic Tin học',
              N'Kết quả cuộc thi Olympic Tin học 2025 đã được công bố.',
              '2025-05-20 10:00', 'SV21001', 'CT001', 'TK002');

-- ---------------------------------------------------------
-- 11. NHATKY
-- ---------------------------------------------------------
INSERT INTO NHATKY (MaNhatKy, MaTK, ThoiGian, HanhDong, MoTa) VALUES
    ('NK001', 'TK004', '2025-05-18 09:12', N'Đăng ký',  N'Đăng ký tham gia Olympic Tin học 2025'),
    ('NK002', 'TK009', '2025-05-18 09:05', N'Duyệt',    N'Duyệt 12 hồ sơ cuộc thi NCKH'),
    ('NK003', 'TK010', '2025-05-17 16:40', N'Xác nhận', N'Xác nhận SV SV21042 đủ điều kiện'),
    ('NK004', 'TK001', '2025-05-17 14:00', N'Cập nhật', N'Sửa thông tin cuộc thi CT005'),
    ('NK005', 'TK008', '2025-05-15 11:30', N'Hủy',      N'Hủy đăng ký cuộc thi Khởi nghiệp');

-- ---------------------------------------------------------
-- 12. PHANQUYEN
-- ---------------------------------------------------------
INSERT INTO PHANQUYEN (MaPhanQuyen, MaVaiTro, TenChucNang, QuyenHan, TrangThai) VALUES
    ('PQ001', 'admin', N'CRUD hệ thống',         N'Toàn quyền',         N'Hoạt động'),
    ('PQ002', 'cb',    N'Duyệt đăng ký',          N'Quản lý cuộc thi',   N'Hoạt động'),
    ('PQ003', 'gv',    N'Xem danh sách tham gia', N'Xác nhận SV',        N'Hoạt động'),
    ('PQ004', 'sv',    N'Đăng ký cuộc thi',       N'Chỉ đọc & đăng ký', N'Hoạt động');
GO