const view=document.getElementById('view');
let state=JSON.parse(localStorage.getItem('state'))||{irpf:35,jornales:[]};
function save(){localStorage.setItem('state',JSON.stringify(state));}
function go(p){p==='inicio'?inicio():sueldometro();}
function inicio(){view.innerHTML=`<div class='card'><h2>Bienvenido/a</h2><p>Jornales: ${state.jornales.length}</p></div>`;}
function quincena(f){return new Date(f).getDate()<=15?'1-15':'16-fin';}
function sueldometro(){
 let q1=0,q2=0;
 state.jornales.forEach(j=>{quincena(j.fecha)==='1-15'?q1+=j.precio:q2+=j.precio});
 const bruto=q1+q2,neto=bruto*(1-state.irpf/100);
 view.innerHTML=`<div class='card'>
 <h2>Sueldómetro</h2>
 <label>IRPF <input type='number' value='${state.irpf}' onchange='setIRPF(this.value)'></label>
 <input type='date' id='f'><input placeholder='Precio' type='number' id='p'>
 <input placeholder='Especialidad' id='e'><input placeholder='Barco' id='b'>
 <input placeholder='Empresa' id='em'><input placeholder='Parte' id='pa'>
 <button onclick='add()'>Añadir</button>
 <hr>${state.jornales.map((j,i)=>`${j.fecha} ${j.precio}€ <button onclick='del(${i})'>X</button>`).join('<br>')}
 <p>Bruto 1-15: ${q1}€</p><p>Bruto 16-fin: ${q2}€</p>
 <p>Total Bruto: ${bruto}€</p><p>Total Neto: ${neto}€</p></div>`;
}
function add(){state.jornales.push({fecha:f.value,precio:+p.value,especialidad:e.value,barco:b.value,empresa:em.value,parte:pa.value});save();sueldometro();}
function del(i){state.jornales.splice(i,1);save();sueldometro();}
function setIRPF(v){state.irpf=+v;save();sueldometro();}
go('inicio');
