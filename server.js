// --- IMPORTS ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// --- INICIALIZACIÓN ---
const app = express();
const PORT = process.env.PORT || 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- IMPORTAR RUTAS Y MIDDLEWARES ---
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// --- SEGURIDAD Y MIDDLEWARES ---
app.use(helmet({
    contentSecurityPolicy: false // Deshabilitar CSP temporalmente para desarrollo
}));

app.use(compression());
app.use(morgan('dev'));

// --- RATE LIMITING ---
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
    message: {
        error: 'Demasiadas solicitudes',
        message: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 mensajes de contacto por ventana
    message: {
        error: 'Demasiados mensajes',
        message: 'Solo puedes enviar 5 mensajes cada 15 minutos.'
    }
});

app.use('/api/', generalLimiter);

app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- SESIONES ---
app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './database' }),
    secret: process.env.SESSION_SECRET || (() => {
        console.warn('⚠️  ADVERTENCIA: Usando SESSION_SECRET por defecto. Configura SESSION_SECRET en .env para producción');
        return 'guerroa-secret-key-2024-' + Math.random().toString(36);
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// --- CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'public/galeria');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${Date.now()}-${name}${ext}`);
    }
});

// Validación de archivos
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB por defecto
    
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Tipo de archivo no permitido. Solo se permiten: JPEG, JPG, PNG, WEBP'), false);
    }
    
    cb(null, true);
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
    }
});

// --- RUTAS DE LA API ---
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);

// --- RUTAS PÚBLICAS ---
app.get('/api/public/services', async (req, res) => {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

app.get('/api/public/gallery', async (req, res) => {
    try {
        const { data: images, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .limit(6);

        if (error) throw error;

        res.json({
            success: true,
            data: images
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener galería' });
    }
});

app.get('/api/public/config', async (req, res) => {
    const { data, error } = await supabase.from('configuracion').select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/public/galeria', (req, res) => {
    const dir = path.join(__dirname, 'public/galeria');
    if (!fs.existsSync(dir)) return res.json([]);
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Error al leer galería' });
        const imagenes = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        res.json(imagenes);
    });
});

// --- GESTIÓN DE ARCHIVOS (ADMIN) ---
app.post('/api/manage/galeria', authenticateToken, upload.single('imagen'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se envió imagen' });
    res.json({ mensaje: 'Imagen subida', archivo: req.file.filename });
});

app.delete('/api/manage/galeria/:nombre', authenticateToken, (req, res) => {
    const ruta = path.join(__dirname, 'public/galeria', req.params.nombre);
    if (fs.existsSync(ruta)) {
        fs.unlinkSync(ruta);
        res.json({ mensaje: 'Imagen eliminada' });
    } else {
        res.status(404).json({ error: 'No existe el archivo' });
    }
});

// --- NAVEGACIÓN ---
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use(errorHandler);

// --- LÓGICA DE INICIO ---
async function crearAdminInicial() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@guerroa.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        console.log(`🔍 Verificando admin inicial con email: ${adminEmail}`);

        const { data: existe, error: searchError } = await supabase
            .from('admins')
            .select('email')
            .eq('email', adminEmail)
            .maybeSingle();

        if (searchError && searchError.code !== 'PGRST116') {
            console.error('❌ Error al buscar admin:', searchError);
            return;
        }

        if (existe) {
            console.log('✅ Admin inicial ya existe');
            return;
        }

        console.log('📝 Creando admin inicial...');
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        const { data: newAdmin, error: insertError } = await supabase
            .from('admins')
            .insert([{
                username: 'admin',
                email: adminEmail,
                password_hash: passwordHash,
                full_name: 'Administrador',
                role: 'super_admin',
                is_active: true
            }])
            .select()
            .single();

        if (insertError) {
            console.error('❌ Error al crear admin inicial:', insertError);
            return;
        }

        console.log('✅ Admin inicial creado exitosamente');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Contraseña: ${adminPassword}`);
        console.log('   ⚠️  CAMBIA LA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN');

    } catch (err) {
        console.error('❌ Error en crearAdminInicial:', err.message);
    }
}

// SOLO UN app.listen AQUÍ
crearAdminInicial().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    });
});