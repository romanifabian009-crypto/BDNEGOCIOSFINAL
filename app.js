// app.js

const path = require('path');
const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const {
  getData,
  getTableData,
  getPedido,
  getTableDetalle,

  getProductos,
  insertarProducto,
  eliminarProducto,

  getClientes,
  insertarCliente,
  eliminarCliente,

  getEmpleados,
  insertarEmpleado,
  eliminarEmpleado,

  getPaises,
  getClientesPais,
  getPedidosPaisCliente,

  getClientesReporte,
  buscarClientes
} = require('./db');

const session = require('express-session');

const app = express();
const PDFDocumentWithTables = require('pdfkit-table');

app.use(session({
  secret: 'ucss_lp2',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

const port = 3000;

/* =========================
   CATEGORIAS PDF
========================= */
app.get('/Rpt_Categorias', async (req, res) => {
  try {
    const data = await getData();
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Categorias.pdf"');

    doc.pipe(res);

    doc.fontSize(25).text('Categorias', { align: 'center' }).moveDown();

    data.forEach(item => {
      doc.fontSize(12).text(`${item.IdCategoria}  ${item.NombreCategoria}`);
    });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).send('Error PDF');
  }
});

/* =========================
   PRODUCTOS PDF
========================= */
app.post('/Rpt_Productos', async (req, res) => {
  try {
    const scat = req.session.sCat;

    const idcat = scat.idcat;
    const NombCat = scat.nombcat;

    const data = await getTableData(idcat);

    const doc = new PDFDocumentWithTables();
    const pdfPath = path.join(__dirname, 'Productos_Cat.pdf');
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    doc.fontSize(20).text(NombCat, { align: 'center' }).moveDown();

    const table = {
      headers: ["ID", "Producto", "Presentacion", "Precio"],
      rows: data.map(r => [
        r.IdProducto,
        r.NombreProducto,
        r.CantidadPorUnidad,
        r.PrecioUnidad
      ])
    };

    await doc.table(table);

    doc.end();

    stream.on('finish', () => {
      res.sendFile(pdfPath);
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error PDF');
  }
});

/* =========================
   PEDIDOS PDF
========================= */
app.post('/Rpt_Pedidos', async (req, res) => {
  try {
    const idPed = req.body.txtIdPed;

    const RegPed = await getPedido(idPed);
    const data = await getTableDetalle(idPed);

    const doc = new PDFDocumentWithTables();
    const pdfPath = path.join(__dirname, 'Pedido.pdf');
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    doc.text(`PEDIDO: ${RegPed[0].IdPedido}`, 50, 100);
    doc.text(`FECHA: ${RegPed[0].FechaPedido}`, 430, 100);

    const table = {
      headers: ["Item", "Producto", "Presentacion", "Precio"],
      rows: data.map(r => [
        r.Item,
        r.NombreProducto,
        r.CantidadPorUnidad,
        r.PrecioUnidad
      ])
    };

    await doc.table(table);

    doc.end();

    stream.on('finish', () => {
      res.sendFile(pdfPath);
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error PDF');
  }
});

/* =========================
   HOME
========================= */
app.get('/', (req, res) => {
  res.render('MenuH');
});

/* =========================
   CATALOGO
========================= */
app.get('/presCatelogo', async (req, res) => {
  const Categorias = await getData();

  res.render('Catalogo', {
    Categorias,
    IdCat: 0,
    NombCat: "",
    Productos: []
  });
});

app.post('/presCatalogo', async (req, res) => {
  let IdCat = req.body.cboCategoria || req.body.idCatx;

  const Categorias = await getData();
  const Productos = await getTableData(IdCat);

  const NombCat = Categorias[IdCat - 1]?.NombreCategoria || "";

  req.session.sCat = { idcat: IdCat, nombcat: NombCat };

  res.render('Catalogo', {
    Categorias,
    IdCat,
    NombCat,
    Productos
  });
});

/* =========================
   BUSCAR PEDIDO
========================= */
app.get('/BuscarPedido', (req, res) => {
  res.render('BuscarPedido', {
    pedido: null,
    detalle: []
  });
});

app.post('/BuscarPedido', async (req, res) => {
  const idPedido = req.body.txtIdPed;

  const pedido = await getPedido(idPedido);
  const detalle = await getTableDetalle(idPedido);

  res.render('BuscarPedido', { pedido, detalle });
});

/* =========================
   CONTACTO
========================= */
app.get('/contacto', (req, res) => {
  res.render('Contacto');
});

/* =========================
   PRODUCTOS
========================= */
app.get('/producto', async (req, res) => {
  const Productos = await getProductos();
  res.render('Producto', { Productos });
});

app.post('/InsertarProducto', async (req, res) => {
  await insertarProducto(...Object.values(req.body));
  res.redirect('/producto');
});

app.post('/EliminarProducto/:id', async (req, res) => {
  await eliminarProducto(req.params.id);
  res.redirect('/producto');
});

/* =========================
   CLIENTES
========================= */
app.get('/cliente', async (req, res) => {
  const Clientes = await getClientes();
  res.render('Cliente', { Clientes });
});

app.post('/InsertarCliente', async (req, res) => {
  await insertarCliente(...Object.values(req.body));
  res.redirect('/cliente');
});

app.post('/EliminarCliente/:id', async (req, res) => {
  await eliminarCliente(req.params.id);
  res.redirect('/cliente');
});

/* =========================
   EMPLEADOS
========================= */
app.get('/empleado', async (req, res) => {
  const Empleados = await getEmpleados();
  res.render('Empleado', { Empleados });
});

app.post('/InsertarEmpleado', async (req, res) => {
  await insertarEmpleado(...Object.values(req.body));
  res.redirect('/empleado');
});

app.post('/EliminarEmpleado/:id', async (req, res) => {
  await eliminarEmpleado(req.params.id);
  res.redirect('/empleado');
});

/* =========================
   PEDIDOS POR PAIS
========================= */
app.get('/PedidosPaisCliente', async (req, res) => {
  const Paises = await getPaises();

  res.render('PedidosPaisCliente', {
    Paises,
    Clientes: [],
    Pedidos: [],
    paisSel: '',
    clienteSel: ''
  });
});

app.post('/PedidosPaisCliente', async (req, res) => {
  const paisSel = req.body.pais;
  const clienteSel = req.body.cliente;

  const Paises = await getPaises();

  const Clientes = paisSel
    ? await getClientesPais(paisSel)
    : [];

  const Pedidos = (paisSel && clienteSel)
    ? await getPedidosPaisCliente(paisSel, clienteSel)
    : [];

  res.render('PedidosPaisCliente', {
    Paises,
    Clientes,
    Pedidos,
    paisSel,
    clienteSel
  });
});

/* =========================
   REPORTES CLIENTES (SIN DUPLICADOS)
========================= */
app.get('/Rpt_Clientes', (req, res) => {
  res.render('RClientes', {
    Clientes: [],
    texto: ''
  });
});

app.post('/Rpt_Clientes', async (req, res) => {
  const data = await getClientesReporte();

  const doc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=Clientes.pdf');

  doc.pipe(res);

  doc.fontSize(20).text('REPORTE DE CLIENTES', { align: 'center' });

  data.forEach(c => {
    doc.text(`${c.IdCliente} - ${c.NombreEmpresa} - ${c.Telefono}`);
  });

  doc.end();
});

/* =========================
   BUSCAR CLIENTES
========================= */
app.get('/ReporteClientes', (req, res) => {
  res.render('ReporteClientes', {
    Clientes: [],
    texto: ''
  });
});

app.post('/ReporteClientes', async (req, res) => {
  const texto = req.body.texto;

  const Clientes = await buscarClientes(texto);

  res.render('ReporteClientes', {
    Clientes,
    texto
  });
});

app.get('/NuevoPedido', async (req, res) => {

  const Clientes = await getClientes();
  const Productos = await getProductos();

  res.render('NuevoPedido', {
    Clientes,
    Productos
  });

});

app.get('/NuevoPedido', async (req, res) => {

  const Clientes = await getClientes();
  const Productos = await getProductos();

  res.render('NuevoPedido', {
    Clientes,
    Productos
  });

});

app.post('/InsertarPedido', async (req, res) => {

  console.log("ENTRÓ A INSERTAR PEDIDO"); // DEBUG

  res.send("OK");

});

app.listen(port, () => {
  console.log(`Servidor en http://localhost:${port}`);
});