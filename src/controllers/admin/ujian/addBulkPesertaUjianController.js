    // src/controllers/admin/ujianSabuk/addBulkPesertaUjianController.js
    const db = require("../../../config/database");

    exports.addBulkPesertaUjian = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const ujianId = parseInt(req.params.ujianId);
        const { peserta_list } = req.body; // array of user_id atau array object { user_id, belt_tujuan_id? }

        if (isNaN(ujianId) || ujianId < 1) {
        return res.status(400).json({ message: "ID ujian tidak valid" });
        }
        if (
        !peserta_list ||
        !Array.isArray(peserta_list) ||
        peserta_list.length === 0
        ) {
        return res
            .status(400)
            .json({ message: "peserta_list harus array tidak kosong" });
        }

        // Ambil data ujian
        const [ujianRows] = await conn.query(
        "SELECT level_ujian FROM ujian_sabuk WHERE id = ? AND deleted_at IS NULL",
        [ujianId],
        );
        if (ujianRows.length === 0) {
        return res
            .status(404)
            .json({ message: "Ujian tidak ditemukan atau sudah dihapus" });
        }
        const levelUjian = ujianRows[0].level_ujian;

        // Tentukan batasan order_level sabuk berdasarkan level ujian
        let minOrder = 1,
        maxOrder = 7; // untuk kota (putih sampai biru strip merah)
        if (levelUjian === "provinsi") {
        minOrder = 8; // merah ke atas
        maxOrder = 15; // sampai DAN V
        }

        await conn.beginTransaction();

        const success = [];
        const errors = [];

        for (const item of peserta_list) {
        let userId,
            beltTujuanId = null;
        // Normalisasi input: bisa integer atau object
        if (typeof item === "number") {
            userId = item;
        } else if (typeof item === "object" && item.user_id) {
            userId = item.user_id;
            beltTujuanId = item.belt_tujuan_id || null;
        } else {
            errors.push({ user_id: item, error: "Format peserta tidak valid" });
            continue;
        }

        // 1. Cek user adalah murid aktif dan memiliki sabuk aktif
        const [userRows] = await conn.query(
            `SELECT u.id, u.name, ub.belt_id AS belt_asal_id, b.order_level
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            JOIN user_belts ub ON ub.user_id = u.id AND ub.is_current = 1
            JOIN belts b ON ub.belt_id = b.id
            WHERE u.id = ? AND r.name = 'murid' AND u.status = 'active'`,
            [userId],
        );
        if (userRows.length === 0) {
            errors.push({
            user_id: userId,
            error:
                "User bukan murid atau tidak aktif atau tidak memiliki sabuk aktif",
            });
            continue;
        }
        const user = userRows[0];
        const beltAsalId = user.belt_asal_id;
        const orderAsal = user.order_level;

        // 2. Validasi order_level sabuk sesuai level ujian
        if (orderAsal < minOrder || orderAsal > maxOrder) {
            errors.push({
            user_id: userId,
            name: user.name,
            error: `Sabuk tidak memenuhi syarat untuk ujian ${levelUjian}`,
            });
            continue;
        }

        // 3. Cek apakah sudah terdaftar di ujian ini
        const [existRows] = await conn.query(
            "SELECT id FROM peserta_ujian WHERE ujian_id = ? AND user_id = ?",
            [ujianId, userId],
        );
        if (existRows.length > 0) {
            errors.push({
            user_id: userId,
            name: user.name,
            error: "Sudah terdaftar di ujian ini",
            });
            continue;
        }

        // 4. Tentukan belt_tujuan
        let finalBeltTujuanId = beltTujuanId;
        if (!finalBeltTujuanId) {
            // Cari belt dengan order_level = orderAsal + 1
            const [nextBelt] = await conn.query(
            "SELECT id FROM belts WHERE order_level = ?",
            [orderAsal + 1],
            );
            if (nextBelt.length === 0) {
            errors.push({
                user_id: userId,
                name: user.name,
                error: "Tidak ditemukan sabuk tujuan (order_level selanjutnya)",
            });
            continue;
            }
            finalBeltTujuanId = nextBelt[0].id;
        } else {
            // Validasi belt_tujuan_id yang diberikan
            const [targetBelt] = await conn.query(
            "SELECT order_level FROM belts WHERE id = ?",
            [finalBeltTujuanId],
            );
            if (targetBelt.length === 0) {
            errors.push({
                user_id: userId,
                name: user.name,
                error: "Belt tujuan tidak valid",
            });
            continue;
            }
            if (targetBelt[0].order_level <= orderAsal) {
            errors.push({
                user_id: userId,
                name: user.name,
                error: "Belt tujuan harus lebih tinggi dari belt asal",
            });
            continue;
            }
        }

        // 5. Insert peserta
        await conn.query(
            `INSERT INTO peserta_ujian (ujian_id, user_id, belt_asal_id, belt_tujuan_id, status)
            VALUES (?, ?, ?, ?, 'terdaftar')`,
            [ujianId, userId, beltAsalId, finalBeltTujuanId],
        );
        success.push({
            user_id: userId,
            name: user.name,
            belt_asal_id: beltAsalId,
            belt_tujuan_id: finalBeltTujuanId,
        });
        }

        await conn.commit();

        return res.status(201).json({
        message: "Proses bulk peserta selesai",
        success_count: success.length,
        error_count: errors.length,
        success,
        errors,
        });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        return res.status(500).json({
        message: "Gagal menambahkan peserta secara bulk",
        error: error.message,
        });
    } finally {
        conn.release();
    }
    };
