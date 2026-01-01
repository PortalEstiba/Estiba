// src/modules/exporter.js
// Exportar CSV (Excel) y PDF (print)

export function exportCSV(jornales, mes, anio) {
  const headers = [
    'Fecha','Precio','IRPF','Especialidad','Barco','Empresa','Parte'
  ];
  const rows = jornales.map(j => [
    j.fecha,
    j.precio,
    j.irpf,
    j.especialidad || '',
    j.barco || '',
    j.empresa || '',
    j.parte || ''
  ]);

  let csv = headers.join(';') + '\n';
  rows.forEach(r => csv += r.join(';') + '\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sueldometro_${mes+1}_${anio}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(containerTitle) {
  const w = window.open('', '_blank');
  w.document.write(`
    <html>
      <head>
        <title>${containerTitle}</title>
        <style>
          body{font-family:Arial;padding:20px}
          h1,h2{margin-bottom:10px}
          table{width:100%;border-collapse:collapse}
          td,th{border:1px solid #ccc;padding:6px;font-size:12px}
        </style>
      </head>
      <body>
        <h1>${containerTitle}</h1>
        ${document.getElementById('sueldometro-root').innerHTML}
      </body>
    </html>
  `);
  w.document.close();
  w.print();
}
