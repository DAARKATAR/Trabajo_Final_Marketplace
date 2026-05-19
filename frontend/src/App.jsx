import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  Users, 
  PlusCircle, 
  ShoppingCart, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Layers, 
  ArrowRight, 
  Activity, 
  Info,
  Server,
  DollarSign,
  Trash2,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  ClipboardList,
  Download,
  Edit,
  CreditCard,
  MapPin,
  User,
  FileText,
  ShieldAlert
} from 'lucide-react';

const GATEWAY_URL = 'http://localhost:3000/api';

function App() {
  // Real Routing based on window.location.pathname
  const [isAdminPath, setIsAdminPath] = useState(() => {
    return window.location.pathname.startsWith('/admin');
  });

  // Current session management
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminUser, setAdminUser] = useState(() => {
    const saved = sessionStorage.getItem('adminUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [userTab, setUserTab] = useState('tienda'); // 'tienda' | 'crud' | 'historial'

  // DB Data
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);

  // Auth Forms
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    metodoPago: 'Tarjeta de Crédito',
    direccion: '',
    nombreTitular: '',
    correoTitular: ''
  });

  // Product CRUD Form (in User visual panel)
  const [editingProduct, setEditingProduct] = useState(null);
  const [crudName, setCrudName] = useState('');
  const [crudPrice, setCrudPrice] = useState('');

  // Simulation Status & Visuals
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [checkoutSteps, setCheckoutSteps] = useState({
    active: false,
    currentStep: 0,
    status: 'idle',
    errorMsg: ''
  });
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Status check states
  const [servicesStatus, setServicesStatus] = useState({
    gateway: 'offline',
    usuarios: 'offline',
    productos: 'offline',
    ordenes: 'offline',
    pagos: 'offline'
  });

  // Toast handler
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 4000);
  };

  // Add Log lines
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  // Fetch Services Status & Data
  const checkServicesStatus = async () => {
    try {
      const { data } = await axios.get(`${GATEWAY_URL}/servicios`);
      const statusObj = {
        gateway: 'online',
        usuarios: 'offline',
        productos: 'offline',
        ordenes: 'offline',
        pagos: 'offline'
      };
      
      data.forEach(service => {
        if (service.nombre === 'usuarios-service') statusObj.usuarios = 'online';
        if (service.nombre === 'productos-service') statusObj.productos = 'online';
        if (service.nombre === 'ordenes-service') statusObj.ordenes = 'online';
        if (service.nombre === 'pagos-soap-service') statusObj.pagos = 'online';
      });

      setServicesStatus(statusObj);
    } catch (e) {
      setServicesStatus({
        gateway: 'offline',
        usuarios: 'offline',
        productos: 'offline',
        ordenes: 'offline',
        pagos: 'offline'
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    await checkServicesStatus();
    try {
      // Load products (needed for both user store and admin inventory check)
      const prodRes = await axios.get(`${GATEWAY_URL}/productos`);
      setProducts(prodRes.data);
      
      // Load user specific orders
      if (currentUser && !isAdminPath) {
        const orderUserRes = await axios.get(`${GATEWAY_URL}/ordenes/usuario/${currentUser.id}`);
        setUserOrders(orderUserRes.data);
      }

      // Load all data if logged in as Admin and on Admin route
      if (adminUser && isAdminPath) {
        const userRes = await axios.get(`${GATEWAY_URL}/usuarios`);
        setUsers(userRes.data);
        const orderAllRes = await axios.get(`${GATEWAY_URL}/ordenes`);
        setOrders(orderAllRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, adminUser, isAdminPath]);

  // Handle User and Admin Authentications
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    try {
      if (isAdminPath) {
        // Admin Login flow: Validate credentials exist in PostgreSQL usuarios_db
        addLog(`[Admin] Validando credenciales de administrador en la base de datos...`, 'info');
        const res = await axios.post(`${GATEWAY_URL}/usuarios/login`, {
          correo: authEmail, // can enter AdminMARK or admin@marketplace.com
          contrasena: authPassword
        });

        const user = res.data;
        if (user.nombre === 'AdminMARK' || user.correo === 'admin@marketplace.com') {
          sessionStorage.setItem('adminUser', JSON.stringify(user));
          setAdminUser(user);
          showToast('Sesión de Administrador iniciada correctamente', 'success');
          addLog(`Acceso concedido a la consola de administración. Usuario: ${user.nombre}`, 'success');
        } else {
          showToast('Acceso denegado: El usuario no tiene privilegios de administrador', 'error');
          addLog(`Acceso rechazado: ${user.nombre} intentó acceder al panel de administración.`, 'error');
        }
        setAuthPassword('');
      } else {
        // Regular User flow
        if (authMode === 'login') {
          addLog(`Intentando iniciar sesión para: ${authEmail}...`, 'info');
          const res = await axios.post(`${GATEWAY_URL}/usuarios/login`, {
            correo: authEmail,
            contrasena: authPassword
          });
          
          const user = res.data;
          // Prevent admin users from logging in on user portal
          if (user.nombre === 'AdminMARK' || user.correo === 'admin@marketplace.com') {
            showToast('Usa el portal de administración (/admin) para ingresar con esta cuenta', 'error');
            addLog(`Ingreso bloqueado: Credenciales de administrador detectadas en portal de compradores.`, 'error');
            return;
          }

          sessionStorage.setItem('currentUser', JSON.stringify(user));
          setCurrentUser(user);
          showToast(`Sesión iniciada: Bienvenido ${user.nombre}`, 'success');
          addLog(`Inicio de sesión de Cliente exitoso. ID: ${user.id}`, 'success');
          setAuthPassword('');
        } else {
          if (!authName) return;
          addLog(`Registrando nuevo usuario: ${authName} (${authEmail})...`, 'info');
          const res = await axios.post(`${GATEWAY_URL}/usuarios`, {
            nombre: authName,
            correo: authEmail,
            contrasena: authPassword
          });
          
          sessionStorage.setItem('currentUser', JSON.stringify(res.data));
          setCurrentUser(res.data);
          showToast('Registro exitoso. Cuenta creada.', 'success');
          addLog(`Usuario creado con éxito en usuarios_db. ID: ${res.data.id}`, 'success');
          setAuthName('');
          setAuthEmail('');
          setAuthPassword('');
        }
      }
    } catch (error) {
      addLog(`Fallo en autenticación: ${error.response?.data?.error || error.message}`, 'error');
      showToast(error.response?.data?.error || 'Credenciales incorrectas o error de conexión', 'error');
    }
  };

  const handleLogout = () => {
    if (isAdminPath) {
      sessionStorage.removeItem('adminUser');
      setAdminUser(null);
      showToast('Sesión de Administrador cerrada', 'info');
      addLog('Sesión de administrador cerrada.', 'info');
    } else {
      sessionStorage.removeItem('currentUser');
      setCurrentUser(null);
      setCart([]);
      setUserOrders([]);
      showToast('Sesión de comprador cerrada', 'info');
      addLog('Sesión de comprador cerrada.', 'info');
    }
  };

  // CRUD Actions for Products
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!crudName || !crudPrice) return;

    try {
      if (editingProduct) {
        addLog(`Actualizando producto ID ${editingProduct.id} a: ${crudName} ($${crudPrice})...`, 'info');
        const res = await axios.put(`${GATEWAY_URL}/productos/${editingProduct.id}`, {
          nombre: crudName,
          precio: parseFloat(crudPrice)
        });
        showToast(`Producto "${res.data.nombre}" actualizado`, 'success');
        addLog(`Producto ID ${res.data.id} modificado en productos_db.`, 'success');
      } else {
        addLog(`Insertando nuevo producto: ${crudName} ($${crudPrice})...`, 'info');
        const res = await axios.post(`${GATEWAY_URL}/productos`, {
          nombre: crudName,
          precio: parseFloat(crudPrice)
        });
        showToast(`Producto "${res.data.nombre}" creado`, 'success');
        addLog(`Producto ID ${res.data.id} registrado en productos_db.`, 'success');
      }
      setEditingProduct(null);
      setCrudName('');
      setCrudPrice('');
      loadData();
    } catch (error) {
      showToast('Error al guardar el producto', 'error');
      addLog(`Error al guardar producto: ${error.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      addLog(`Eliminando producto ID ${id}...`, 'info');
      await axios.delete(`${GATEWAY_URL}/productos/${id}`);
      showToast('Producto eliminado', 'success');
      addLog(`Producto ID ${id} eliminado de productos_db.`, 'success');
      loadData();
    } catch (error) {
      showToast('Error al eliminar producto', 'error');
      addLog(`Error al eliminar producto ID ${id}: ${error.message}`, 'error');
    }
  };

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    addLog(`Carrito: Añadido "${product.nombre}"`, 'info');
    showToast(`"${product.nombre}" agregado al carrito`, 'info');
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const updateQty = (id, change) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === id) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);

  // Trigger payment flow
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutData({
      metodoPago: 'Tarjeta de Crédito',
      direccion: '',
      nombreTitular: currentUser.nombre,
      correoTitular: currentUser.correo
    });
    setShowCheckout(true);
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!checkoutData.direccion) {
      showToast('Debe ingresar una dirección de envío', 'error');
      return;
    }
    
    setShowCheckout(false);

    setCheckoutSteps({
      active: true,
      currentStep: 1,
      status: 'processing',
      errorMsg: ''
    });

    addLog('====================================================', 'info');
    addLog('INICIANDO CONEXIÓN MULTIPROCESO - COMPRA DE PRODUCTO', 'info');
    addLog(`Cliente: ${currentUser.nombre} | Dirección: ${checkoutData.direccion}`, 'info');
    addLog(`Artículos de cobro simulado: ${cart.length} productos distintos`, 'info');

    // Step 1: Gateway Proxy REST JSON
    await new Promise(r => setTimeout(r, 1200));
    addLog('[Paso 1] Transmitiendo POST /api/ordenes al API Gateway (Puerto 3000)...', 'info');
    const orderPayload = {
      usuarioId: currentUser.id,
      productos: cart.map(item => ({
        productoId: item.product.id,
        cantidad: item.quantity
      })),
      metodoPago: checkoutData.metodoPago
    };
    addLog(`[REST JSON Gateway Payload]: ${JSON.stringify(orderPayload)}`, 'info');

    // Step 2: Gateway to Users DB check
    setCheckoutSteps(prev => ({ ...prev, currentStep: 2 }));
    await new Promise(r => setTimeout(r, 1200));
    addLog('[Paso 2] Ordenes-Service consultando a Usuarios-Service (Puerto 3001) para validar sesión activa...', 'info');
    addLog(`[Base de Datos SQL] SELECT * FROM usuarios WHERE id = ${currentUser.id}`, 'success');
    addLog(`[Respuesta JSON]: Usuario encontrado: ${JSON.stringify(currentUser)}`, 'success');

    // Step 3: Gateway to Product DB check
    setCheckoutSteps(prev => ({ ...prev, currentStep: 3 }));
    await new Promise(r => setTimeout(r, 1200));
    addLog(`[Paso 3] Ordenes-Service solicitando verificación de múltiples productos a Productos-Service (Puerto 3002)...`, 'info');
    addLog(`[Base de Datos SQL] SELECT * FROM productos WHERE id IN (...)`, 'success');
    addLog(`[Respuesta JSON]: Productos verificados`, 'success');

    // Step 4: Bank SOAP XML request
    setCheckoutSteps(prev => ({ ...prev, currentStep: 4 }));
    await new Promise(r => setTimeout(r, 1500));
    const finalTotal = cart.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);
    addLog('[Paso 4] Llamando a Pasarela Bancaria SOAP (Puerto 3004) mediante paquete XML...', 'info');
    const requestXML = `
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <pago>
      <usuarioId>${currentUser.id}</usuarioId>
      <monto>${finalTotal}</monto>
      <metodoPago>${checkoutData.metodoPago}</metodoPago>
    </pago>
  </Body>
</Envelope>`.trim();
    addLog(`[SOAP XML Petición enviada al Banco]:\n${requestXML}`, 'xml');

    const responseXML = `
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <respuesta>
      <estado>APROBADO</estado>
      <codigoTransaccion>TX-${Math.floor(Math.random() * 900000 + 100000)}</codigoTransaccion>
      <montoDebitador>${finalTotal}</montoDebitador>
    </respuesta>
  </Body>
</Envelope>`.trim();
    addLog(`[SOAP XML Respuesta Banco]:\n${responseXML}`, 'success');
    addLog(`[Base de Datos SQL] INSERT INTO pagos (usuario_id, monto, estado) VALUES (${currentUser.id}, ${finalTotal}, 'APROBADO')`, 'success');

    // Step 5: Save order in orders postgres DB
    setCheckoutSteps(prev => ({ ...prev, currentStep: 5 }));
    try {
      const res = await axios.post(`${GATEWAY_URL}/ordenes`, orderPayload);
      await new Promise(r => setTimeout(r, 1000));
      addLog('[Paso 5] Guardando las órdenes en el servicio central de órdenes (Puerto 3003)...', 'info');
      addLog(`[Base de Datos SQL] INSERT INTO ordenes ... VALUES (Múltiples registros)`, 'success');
      
      const transactionId = res.data.codigoCompra || (res.data.ordenes ? res.data.ordenes.map(o => o.id).join(', ') : 'N/A');
      
      setLastCreatedOrder({
        id: transactionId,
        fecha: new Date().toLocaleDateString(),
        cliente: currentUser.nombre,
        correo: currentUser.correo,
        productos: cart.map(item => ({
          nombre: item.product.nombre,
          cantidad: item.quantity,
          precio: item.product.precio
        })),
        total: finalTotal,
        metodoPago: checkoutData.metodoPago,
        direccion: checkoutData.direccion,
        estadoPago: res.data.estadoPago || 'APROBADO'
      });

      setCheckoutSteps(prev => ({ ...prev, status: res.data.estadoPago === 'RECHAZADO' ? 'error' : 'completed' }));
      
      if (res.data.estadoPago === 'RECHAZADO') {
        showToast('Pago rechazado por el banco. Orden guardada en historial.', 'error');
        addLog(`Transacción guardada como FALLIDA. Orden ID: ${transactionId}`, 'error');
      } else {
        showToast('¡Transacción aprobada y persistida en BD!', 'success');
        addLog(`Transacción finalizada con éxito. Orden ID: ${transactionId}`, 'success');
      }
      addLog('====================================================', 'info');
      
      setCart([]);
      setShowReceipt(true);
      loadData();
    } catch (err) {
      console.error(err);
      addLog(`[ERROR EN TRANSACCIÓN]: ${err.response?.data?.error || err.message}`, 'error');
      setCheckoutSteps(prev => ({ 
        ...prev, 
        status: 'error',
        errorMsg: err.response?.data?.error || 'No se pudo registrar la transacción.' 
      }));
      showToast('Fallo en la persistencia del cobro', 'error');
      addLog('====================================================', 'error');
    }
  };

  // Reconstruct past receipt for viewing/downloading
  const handleViewPastReceipt = (order) => {
    let productosDetalle = [];
    try {
      const parsed = JSON.parse(order.productosDetalle || '[]');
      productosDetalle = parsed.map(item => {
        const productItem = products.find(p => p.id === item.productoId) || { nombre: `Producto ID #${item.productoId}` };
        return {
          nombre: productItem.nombre,
          cantidad: item.cantidad,
          precio: item.precio
        };
      });
    } catch (e) {
      console.error("Error al parsear el detalle de la compra", e);
    }

    const buyer = users.find(u => u.id === order.usuarioId) || { nombre: `Usuario #${order.usuarioId}`, correo: 'N/A' };

    setLastCreatedOrder({
      id: order.codigoCompra || order.id.toString(),
      fecha: new Date(order.fechaCreacion).toLocaleDateString(),
      cliente: buyer.nombre,
      correo: buyer.correo,
      productos: productosDetalle,
      total: parseFloat(order.total),
      metodoPago: 'Simulado (PSE / Tarjeta)',
      direccion: 'Dirección Registrada en Cuenta',
      estadoPago: order.estadoPago || 'APROBADO'
    });
    setShowReceipt(true);
    addLog(`Cargando comprobante de pago histórico de Compra ID #${order.codigoCompra || order.id}`, 'info');
  };

  // Export receipt as raw formatted text
  const downloadReceiptText = () => {
    if (!lastCreatedOrder) return;
    const itemsText = lastCreatedOrder.productos 
      ? lastCreatedOrder.productos.map(p => `- ${p.cantidad}x ${p.nombre} ($${p.precio.toLocaleString('es-CO')} c/u)`).join('\n') 
      : '';
      
    const txt = `
========================================
       NEXUS MARKETPLACE RECEIPT
========================================
ID Orden:   ${lastCreatedOrder.id}
Fecha:      ${lastCreatedOrder.fecha}
Estado:     APROBADO (PAGO CONSOAP)
----------------------------------------
Cliente:    ${lastCreatedOrder.cliente}
Correo:     ${lastCreatedOrder.correo}
Direccion:  ${lastCreatedOrder.direccion}
Metodo:     ${lastCreatedOrder.metodoPago}
----------------------------------------
Detalle:
${itemsText}
Total:      $${lastCreatedOrder.total.toLocaleString('es-CO')} COP
========================================
Gracias por su compra. Transaccion segura.
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([txt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `factura_${lastCreatedOrder.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="app-container">
      {/* Toast alert */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <ShoppingBag className="brand-icon" size={24} style={{ color: 'var(--accent-orange)' }} />
          <h1 className="brand-title">
            {isAdminPath ? 'Nexus Admin Dashboard' : 'Nexus Marketplace'}
          </h1>
        </div>

        {/* Real path toggles (available only to the admin if logged in) */}
        {isAdminPath && adminUser && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a 
              href="/"
              className="qty-btn"
              style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', color: 'var(--text-secondary)' }}
            >
              Ir a la Tienda
            </a>
          </div>
        )}
        {!isAdminPath && currentUser && (currentUser.nombre === 'AdminMARK' || currentUser.correo === 'admin@marketplace.com') && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a 
              href="/admin"
              className="qty-btn"
              style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', color: 'var(--accent-orange)' }}
            >
              Panel de Admin
            </a>
          </div>
        )}

        {/* Service Badges */}
        <div className="status-container">
          {isAdminPath && (
            <div className="status-badge" title="API Gateway">
              <Server size={12} color="#9ca3af" />
              <span>Gateway</span>
              <span className={`status-dot ${servicesStatus.gateway}`}></span>
            </div>
          )}
          <div className="status-badge" title="Usuarios Database">
            <Database size={12} color="#9ca3af" />
            <span>Usuarios DB</span>
            <span className={`status-dot ${servicesStatus.usuarios}`}></span>
          </div>
          <div className="status-badge" title="Productos Database">
            <Database size={12} color="#9ca3af" />
            <span>Productos DB</span>
            <span className={`status-dot ${servicesStatus.productos}`}></span>
          </div>
          <div className="status-badge" title="Ordenes Database">
            <Database size={12} color="#9ca3af" />
            <span>Ordenes DB</span>
            <span className={`status-dot ${servicesStatus.ordenes}`}></span>
          </div>
          <div className="status-badge" title="Pagos SOAP Service">
            <DollarSign size={12} color="#9ca3af" />
            <span>SOAP Pagos</span>
            <span className={`status-dot ${servicesStatus.pagos}`}></span>
          </div>
        </div>
      </header>

      {/* Auth Gateways based on path */}
      {((isAdminPath && !adminUser) || (!isAdminPath && !currentUser)) ? (
        /* Auth Screen (Completely clean of Admin/User hints) */
        <main className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-header">
              {isAdminPath ? (
                <ShieldAlert size={48} color="var(--accent-orange)" style={{ margin: '0 auto 1rem', display: 'block' }} />
              ) : (
                <ShoppingBag size={48} color="var(--accent-orange)" style={{ margin: '0 auto 1rem', display: 'block' }} />
              )}
              <h2>{isAdminPath ? 'Consola de Administración' : 'Nexus Marketplace'}</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isAdminPath ? 'Ingresa tus credenciales para administrar los servicios' : 'Ingresa tus credenciales para realizar tus compras'}
              </p>
            </div>

            <form onSubmit={handleAuth}>
              {(!isAdminPath && authMode === 'register') && (
                <div className="form-group">
                  <label className="form-label">Nombre Completo:</label>
                  <input 
                    type="text" 
                    placeholder="Escribe tu nombre" 
                    className="form-input" 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Usuario o Correo Electrónico:</label>
                <input 
                  type="text" 
                  placeholder="Usuario o Correo" 
                  className="form-input" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña:</label>
                <input 
                  type="password" 
                  placeholder="Contraseña" 
                  className="form-input" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <LogIn size={16} />
                Ingresar al Portal
              </button>
            </form>

            {/* Register toggle (only available on user portal) */}
            {!isAdminPath && (
              <div className="auth-toggle">
                {authMode === 'login' ? (
                  <>¿No tienes cuenta? <span onClick={() => setAuthMode('register')}>Regístrate aquí</span></>
                ) : (
                  <>¿Ya tienes cuenta? <span onClick={() => setAuthMode('login')}>Inicia sesión</span></>
                )}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* App Layout split into ViewModes */
        <main className="main-grid" style={{ gridTemplateColumns: isAdminPath ? '1fr 450px' : '1fr 380px' }}>
          
          {/* Left Main panel */}
          <section className="column" style={{ backgroundColor: '#09090b' }}>
            {isAdminPath ? (
              /* Visual Admin / Metrics View (Strictly on /admin path) */
              <>
                <div className="column-header">
                  <Settings size={18} color="var(--accent-orange)" />
                  <h2>Consola de Depuración (Administrador)</h2>
                </div>

                <div className="column-content" style={{ overflowY: 'auto', flex: 1, gap: '2rem' }}>
                  
                  {/* Metrics Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="visualizer-container" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuarios en DB</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{users.length}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conectados a usuarios_db</span>
                    </div>
                    <div className="visualizer-container" style={{ padding: '1rem' }}>
                      <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ventas Realizadas</h4>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{orders.length}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Registradas en ordenes_db</span>
                    </div>
                  </div>

                  {/* Product CRUD system (Admin Only) */}
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Gestión de Productos (productos_db)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Catálogo Actual</h4>
                        <div className="crud-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {products.map(p => (
                            <div className="crud-item" key={p.id} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-primary)' }}>
                              <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.nombre}</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 700 }}>
                                  ${p.precio.toLocaleString('es-CO')} COP
                                </span>
                              </div>
                              <div className="crud-actions">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setCrudName(p.nombre);
                                    setCrudPrice(p.precio.toString());
                                  }} 
                                  className="icon-btn" 
                                  title="Editar"
                                  style={{ color: 'var(--accent-orange)' }}
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)} 
                                  className="icon-btn" 
                                  title="Eliminar"
                                  style={{ color: 'var(--accent-red)' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {products.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay productos registrados.</p>
                          )}
                        </div>
                      </div>

                      <div className="visualizer-container" style={{ alignSelf: 'start', padding: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '1rem' }}>
                          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h4>
                        <form onSubmit={handleSaveProduct}>
                          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Nombre del artículo:</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Ej. Teclado mecánico" 
                              value={crudName}
                              onChange={(e) => setCrudName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Precio ($ COP):</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              placeholder="120000" 
                              value={crudPrice}
                              onChange={(e) => setCrudPrice(e.target.value)}
                              required
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-success" style={{ fontSize: '0.75rem', flex: 1 }}>
                              <PlusCircle size={14} /> Guardar
                            </button>
                            {editingProduct && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingProduct(null);
                                  setCrudName('');
                                  setCrudPrice('');
                                }} 
                                className="btn" 
                                style={{ fontSize: '0.75rem', background: '#374151' }}
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Users Admin Table */}
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Usuarios Registrados (usuarios_db)</h3>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Nombre Completo</th>
                            <th>Correo Electrónico</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(u => {
                            return (
                              <tr key={u.id}>
                                <td><span style={{ fontWeight: 600 }}>{u.nombre}</span></td>
                                <td style={{ color: 'var(--text-secondary)' }}>{u.correo}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* General Orders Admin Table */}
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Todas las Órdenes en el Sistema (ordenes_db)</h3>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID Transacción</th>
                            <th>Cliente</th>
                            <th>Cant. Artículos</th>
                            <th>Total Pagado</th>
                            <th>Estado Pago</th>
                            <th style={{ textAlign: 'center' }}>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => {
                            const buyerName = users.find(u => u.id === o.usuarioId)?.nombre || `Usuario #${o.usuarioId}`;
                            return (
                            <tr key={o.id}>
                              <td><span style={{ fontWeight: 700 }}>#{o.codigoCompra || o.id}</span></td>
                              <td>{buyerName}</td>
                              <td>{o.cantidad} unid.</td>
                              <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${parseFloat(o.total).toLocaleString('es-CO')}</td>
                              <td>
                                <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.35rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px', color: 'var(--accent-green)' }}>
                                  {o.estadoPago}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button 
                                  onClick={() => handleViewPastReceipt(o)}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: 'auto', display: 'inline-flex', gap: '0.25rem' }}
                                >
                                  <FileText size={12} /> Ver
                                </button>
                              </td>
                            </tr>
                            );
                          })}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No hay órdenes en el sistema</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              /* User Mode Main Area (On root path /) */
              <>
                <div className="column-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--accent-orange)" />
                    <h2>Portal de Compras</h2>
                  </div>
                  
                  {/* Tab Selector */}
                  <div style={{ display: 'flex', gap: '0.25rem', width: '220px' }}>
                    <button 
                      onClick={() => setUserTab('tienda')} 
                      className={`btn ${userTab === 'tienda' ? 'btn-primary' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', background: userTab === 'tienda' ? 'var(--accent-orange)' : 'var(--bg-tertiary)' }}
                    >
                      Catálogo
                    </button>
                    <button 
                      onClick={() => setUserTab('historial')} 
                      className={`btn ${userTab === 'historial' ? 'btn-primary' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', background: userTab === 'historial' ? 'var(--accent-orange)' : 'var(--bg-tertiary)' }}
                    >
                      Mi Historial
                    </button>
                  </div>
                </div>

                <div className="column-content" style={{ overflowY: 'auto', flex: 1 }}>
                  
                  {userTab === 'tienda' && (
                    /* Catalog grid view */
                    <div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Artículos Recientes</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Explora productos subidos por otros usuarios listos para comprar.</p>
                      </div>
                      
                      <div className="catalog-grid">
                        {products.map(p => (
                          <div className="product-card" key={p.id}>
                            <div className="product-info">
                              <h3 style={{ minHeight: '2.5rem' }}>{p.nombre}</h3>
                              <div className="product-price">
                                ${p.precio.toLocaleString('es-CO')} COP
                              </div>
                            </div>
                            <button onClick={() => addToCart(p)} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                              <ShoppingCart size={14} /> Agregar al Carrito
                            </button>
                          </div>
                        ))}
                        {products.length === 0 && (
                          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
                            <Info size={32} style={{ margin: '0 auto 1rem', color: 'var(--accent-orange)' }} />
                            <p>El catálogo está vacío. Por favor, espera a que un administrador registre nuevos artículos.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}



                  {userTab === 'historial' && (
                    /* User-specific order history page with receipt download */
                    <div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Historial de Transacciones</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Consulta o descarga tus comprobantes de pago en cualquier momento.
                        </p>
                      </div>

                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>ID Compra</th>
                              <th>Artículos Totales</th>
                              <th>Monto Total</th>
                              <th>Pago Banco</th>
                              <th>Fecha de Registro</th>
                              <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userOrders.map(o => (
                              <tr key={o.id}>
                                <td><span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>#{o.codigoCompra || o.id}</span></td>
                                <td>{o.cantidad} artículos</td>
                                <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                                  ${parseFloat(o.total).toLocaleString('es-CO')}
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.35rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '4px', color: 'var(--accent-green)' }}>
                                    {o.estadoPago}
                                  </span>
                                </td>
                                <td>{new Date(o.fechaCreacion).toLocaleString()}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button 
                                    onClick={() => handleViewPastReceipt(o)}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', width: 'auto', display: 'inline-flex', gap: '0.25rem' }}
                                  >
                                    <FileText size={12} /> Comprobante
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {userOrders.length === 0 && (
                              <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                  No has realizado compras todavía.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </section>

          {/* Right sidebar */}
          <section className="column">
            
            {/* User Session Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', border: '1px solid var(--accent-orange)' }}>
                  <User size={16} color="var(--accent-orange)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {isAdminPath ? adminUser.nombre : currentUser.nombre}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {isAdminPath ? 'Consola Administrador' : `ID Cliente: ${currentUser.id}`}
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="qty-btn" style={{ color: 'var(--accent-red)', padding: '0.35rem' }} title="Cerrar Sesión">
                <LogOut size={16} />
              </button>
            </div>

            <div className="column-content" style={{ flex: 1, overflowY: 'auto' }}>
              {!isAdminPath ? (
                /* User Right Panel: Shopping Cart */
                <div className="cart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <ShoppingCart size={16} color="var(--accent-orange)" />
                      Carrito de Compras
                    </h3>
                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      {cart.length} item(s)
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {cart.map(item => (
                      <div className="cart-item" key={item.product.id}>
                        <div className="cart-item-info">
                          <h4 style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.nombre}</h4>
                          <span>${item.product.precio.toLocaleString('es-CO')} c/u</span>
                        </div>
                        <div className="cart-item-qty">
                          <button onClick={() => updateQty(item.product.id, -1)} className="qty-btn">-</button>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '12px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQty(item.product.id, 1)} className="qty-btn">+</button>
                          <button onClick={() => removeFromCart(item.product.id)} className="qty-btn" style={{ marginLeft: '0.25rem', color: 'var(--accent-red)' }} title="Eliminar">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        Tu carrito está vacío.
                      </div>
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="cart-summary" style={{ border: 'none', padding: 0 }}>
                        <span style={{ fontSize: '0.85rem' }}>Total:</span>
                        <span style={{ color: 'var(--accent-orange)', fontSize: '1.25rem' }}>
                          ${cartTotal.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                      <button onClick={handleOpenCheckout} className="btn btn-success" style={{ marginTop: '0.75rem' }}>
                        Proceder al Pago
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Admin Right Panel: Logistics Dashboard details */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="visualizer-container">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={16} />
                      Servicios de Gateway & SOAP
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      El API Gateway redirige peticiones JSON a través de proxies REST, y se comunica con un banco simulado usando sobres XML SOAP encapsulados.
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Progress (Simple UI for users) */}
              {checkoutSteps.active && !isAdminPath && (
                <div className="visualizer-container" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    Procesando Transacción
                  </h3>
                  
                  <div style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 600, minHeight: '1.5rem' }}>
                    {checkoutSteps.currentStep === 1 && 'Iniciando conexión segura...'}
                    {checkoutSteps.currentStep === 2 && 'Validando credenciales...'}
                    {checkoutSteps.currentStep === 3 && 'Verificando disponibilidad de artículos...'}
                    {checkoutSteps.currentStep === 4 && 'Cargando solicitud en la pasarela bancaria...'}
                    {checkoutSteps.currentStep === 5 && 'Finalizando compra...'}
                    {checkoutSteps.status === 'completed' && <span style={{ color: 'var(--accent-green)' }}>¡Compra procesada con éxito!</span>}
                    {checkoutSteps.status === 'error' && <span style={{ color: 'var(--accent-red)' }}>Hubo un error en la transacción.</span>}
                  </div>
                  
                  {checkoutSteps.status === 'processing' && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                      <div className="loading-spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <style dangerouslySetInnerHTML={{__html: `
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                      `}} />
                    </div>
                  )}
                </div>
              )}

              {/* Monospaced Log Console */}
              {isAdminPath && (
                <div className="console-container" style={{ minHeight: '260px' }}>
                  <div className="console-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Terminal size={12} color="var(--accent-orange)" />
                      <span>Consola de Peticiones y Respuestas de Red</span>
                    </div>
                    <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}>
                      Limpiar
                    </button>
                  </div>
                  <div className="console-body" style={{ maxHeight: '250px' }}>
                    {logs.map((log, index) => {
                      let className = 'console-line';
                      if (log.includes('[SOAP XML')) className += ' xml';
                      else if (log.includes('exitosamente') || log.includes('éxito') || log.includes('exitoso') || log.includes('validado') || log.includes('verificado') || log.includes('encontrado')) className += ' success';
                      else if (log.includes('Error') || log.includes('Fallo') || log.includes('ERROR')) className += ' error';
                      else className += ' info';
                      
                      return (
                        <div className={className} key={index}>
                          {log}
                        </div>
                      );
                    })}
                    {logs.length === 0 && (
                      <div style={{ color: '#4b5563', fontStyle: 'italic', textAlign: 'center', marginTop: '4rem' }}>
                        Escuchando actividad del sistema...
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>

        </main>
      )}

      {/* Checkout Sidebar/Modal Overlay */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="var(--accent-orange)" />
                Confirmación de Pago Bancario
              </h3>
              <button 
                onClick={() => setShowCheckout(false)} 
                className="qty-btn" 
                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSimulatePayment}>
              <div className="modal-body">
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                    <span style={{ fontWeight: 600 }}>{currentUser.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Correo:</span>
                    <span>{currentUser.correo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <span>Total a Debitar:</span>
                    <span style={{ color: 'var(--accent-orange)' }}>${cartTotal.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago:</label>
                  <select 
                    className="form-input form-select"
                    value={checkoutData.metodoPago}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  >
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito (Aprobada)</option>
                    <option value="Tarjeta de Crédito (Rechazada)">Tarjeta de Crédito (Simular Fondos Insuficientes)</option>
                    <option value="Transferencia PSE">Transferencia PSE (Aprobada)</option>
                    <option value="Transferencia PSE (Fallo)">Transferencia PSE (Simular Caída del Banco)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección de Envío:</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Calle 123 # 45-67, Bogotá"
                    value={checkoutData.direccion}
                    onChange={(e) => setCheckoutData(prev => ({ ...prev, direccion: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
                <button type="submit" className="btn btn-success">
                  Confirmar Transacción
                </button>
                <button type="button" onClick={() => setShowCheckout(false)} className="btn" style={{ background: '#374151', color: 'white' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {showReceipt && lastCreatedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Comprobante de Pago</h3>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="qty-btn" 
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Printable receipt block */}
              <div className="receipt-container" id="print-receipt">
                <div className="receipt-header">
                  <ShoppingBag size={32} color="#ea580c" style={{ margin: '0 auto' }} />
                  <h3>NEXUS MARKETPLACE</h3>
                  <p>Comprobante de Pago Simulación</p>
                </div>

                <div className="receipt-details">
                  <div className="receipt-row">
                    <span>Código de Venta:</span>
                    <span>#ORD-00{lastCreatedOrder.id}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Fecha:</span>
                    <span>{lastCreatedOrder.fecha}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Estado:</span>
                    <span style={{ color: lastCreatedOrder.estadoPago === 'RECHAZADO' ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      {lastCreatedOrder.estadoPago || 'APROBADO'}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span>Cliente:</span>
                    <span>{lastCreatedOrder.cliente}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Correo:</span>
                    <span>{lastCreatedOrder.correo}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Dirección:</span>
                    <span>{lastCreatedOrder.direccion}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Método de Pago:</span>
                    <span>{lastCreatedOrder.metodoPago}</span>
                  </div>
                </div>

                <div className="receipt-items">
                  <div className="receipt-item-row" style={{ fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    <span>Descripción</span>
                    <span>Monto</span>
                  </div>
                  {lastCreatedOrder.productos && lastCreatedOrder.productos.map((prod, idx) => (
                    <div className="receipt-item-row" key={idx}>
                      <span>{prod.cantidad}x {prod.nombre}</span>
                      <span>${(prod.precio * prod.cantidad).toLocaleString('es-CO')} COP</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-total">
                  <span>TOTAL PAGADO:</span>
                  <span>${lastCreatedOrder.total.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              {/* Actions panel */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ background: 'var(--accent-orange)' }}>
                  <Download size={14} /> Exportar como PDF (Imprimir)
                </button>
                <button onClick={downloadReceiptText} className="btn" style={{ background: '#374151', color: 'white' }}>
                  Descargar Factura (Texto)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
