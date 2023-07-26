const botonesFoto = document.querySelectorAll('.btn-foto');
const urlApi = 'https://routersuculentapi-production.up.railway.app'
const estadoSaludable = document.getElementById('estadoSalud1');
const estadoEnferma = document.getElementById('estadoSalud2');
const selectSintomas = document.getElementById('sintoma');
const consejo = document.getElementById('consejo');
const formulario = document.getElementById('form-fotos');

const botonCapturarFoto = document.getElementById('capture-btn');
let stream; // Variable para almacenar el flujo de la cámara
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const photoElement = document.getElementById('photo');
const botonAceptarCapturaFoto = document.getElementById('btn-aceptar-foto');
const modalFoto = document.getElementById('modalFoto')

// fotos tomadas
let fotosTomadas = {};
let idBotonActualTomarFoto = '';


// agregar eventos a los botones de tomar fotos
botonesFoto.forEach(boton => {
  boton.addEventListener('click', e => accionModalTomarFoto(boton))
});

//eventos para captura foto y aceptar captura modal
botonCapturarFoto.addEventListener('click', e => takePhoto());
botonAceptarCapturaFoto.addEventListener('click', e => aceptarCapturaFotoModal());

//evento cuando se cierra el modal
modalFoto.addEventListener('hidden.bs.modal', event => {
  stopCamera();
})


//evento submit formulario
formulario.addEventListener('submit', e => enviarFormularioServicio(e));

async function accionModalTomarFoto(botonClicado) {

  let loading = document.getElementById('loading-modal');
  loading.classList.remove('d-none');


  console.log('Tomar foto boton ' + botonClicado.getAttribute('id'));
  idBotonActualTomarFoto = botonClicado.getAttribute('id');



  try {

    const constraints = {
      video: {
        facingMode: 'environment', // Intentar usar la cámara trasera (si está disponible)
        width: { ideal: 1200},  // Ancho ideal del video
        height: { ideal: 1200 }, // Altura ideal del video
        focusMode: 'continuous'
      }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // Muestra el video y oculta la imagen y el canvas
    videoElement.style.display = 'block';
    canvasElement.style.display = 'none';
    photoElement.style.display = 'none';

    //mostrar boton capturar foto y ocultar el de aceptar
    botonCapturarFoto.style.display = 'block';
    botonAceptarCapturaFoto.style.display = 'none';

    
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    alert('Error al acceder a la cámara ' + err);
  }
  
  loading.classList.add('d-none');
}

 // Ajustar el tamanio del canvas para mantener relacion de aspecto
 function resizeCanvas() {

  const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
  const width = videoElement.offsetWidth;
  const height = width / aspectRatio;

  canvasElement.width = width;
  canvasElement.height = height;
}



// Función para tomar la foto y mostrarla en el elemento <img>
function takePhoto() {

  resizeCanvas();

  // Dibuja el video en el canvas
  canvasElement.getContext('2d').drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  // Establece la imagen capturada como la fuente de la imagen
  //photoElement.src = canvasElement.toDataURL('image/png');

  // Convierte el contenido del canvas a un Blob en formato JPG
  canvasElement.toBlob(function (blob) {

    // Establece la imagen capturada como la fuente de la imagen
    const imageUrl = URL.createObjectURL(blob);
    photoElement.src = imageUrl;

  }, 'image/jpeg', 1); // Calidad JPG de 100%

  // Muestra la imagen y oculta el video y el canvas
  videoElement.style.display = 'none';
  canvasElement.style.display = 'none';
  photoElement.style.display = 'block';

  //ocultar boton capturar foto y mostrar el de aceptar
  botonCapturarFoto.style.display = 'none';
  botonAceptarCapturaFoto.style.display = 'block';

  // Detener la cámara y liberar recursos
  stopCamera();

}


// Función para detener la cámara
function stopCamera() {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }
}

function aceptarCapturaFotoModal() {

  const imageUrl = photoElement.src;

  fetch(imageUrl)
    .then(response => response.blob())
    .then(imageBlob => {

      // aqui se tiene el objeto Blob de la imagen capturada
      // se agrega al arreglo de fotos
      fotosTomadas[idBotonActualTomarFoto] = imageBlob;
      console.log(fotosTomadas);

      cambiarColorBotonFotoTomada();


    })
    .catch(error => {
      console.error('Error al obtener la imagen:', error);
    });

}

function cambiarColorBotonFotoTomada() {
  let boton = document.getElementById(idBotonActualTomarFoto);
  boton.classList.remove('btn-warning');
  boton.classList.add('btn-success');
}

async function obtenerSintomasApi() {

  try {
    const response = await fetch(urlApi + '/sintomas');

    if (!response.ok) {
      throw new Error('El servicio no devolvió éxito al obtener sintomas');
    }

    const data = await response.json();

    cargarSelectConSintomas(data);
    resetForm();


  } catch (error) {
    console.error('Error en la petición:', error);
  }
}

obtenerSintomasApi();

function cargarSelectConSintomas(data) {

  selectSintomas.innerHTML = '';

  data.data.forEach(sintoma => {
    const option = document.createElement('option');
    option.value = sintoma.idSintoma;
    option.innerText = sintoma.sintoma;
    selectSintomas.appendChild(option);
  });
}

function resetForm() {

  fotosTomadas = {};
  idBotonActualTomarFoto = '';
  botonesFoto.forEach(btn => {
    btn.classList.remove('btn-success');
    btn.classList.add('btn-warning');
  });

  estadoEnferma.checked = true;
  selectSintomas.selectedIndex = 0;
  consejo.value = '';

  let loadingPage = document.getElementById('loading-page');
  loadingPage.classList.add('d-none');

  let contenMain = document.getElementById('content-main');
  contenMain.classList.remove('d-none');


}

function enviarFormularioServicio(event) {

  event.preventDefault(); // Evita la recarga de la página al enviar el formulario

  if (Object.keys(fotosTomadas).length == 0) {
    alert('Parece que aún no ha tomado ningúna foto.');
    return false;
  }

  console.log('== ENVIAR FORMULARIO ==');

  // Obtener el formulario y sus datos
  const formulario = event.target;
  const formData = new FormData(formulario);

  cambiarIdSintoma(formData);

  completarFormData(formData);

  // Imprimir el contenido de FormData en la consola
  for (const entry of formData.entries()) {
    console.log(entry[0] + ':', entry[1]);
  }

  enviarFormulario(formData);

}

function cambiarIdSintoma(formData) {

  let estadoSalud = formData.get('estadoSalud');

  if (estadoSalud === 'SALUDABLE') {

    formData.set('idSintoma', 'SALUDABLE');

  }
}

function completarFormData(formData) {

  //quitar estado salud formData
  formData.delete('estadoSalud');

  //agregar fotos
  for (var key in fotosTomadas) {

    const blod = new Blob([fotosTomadas[key]], { type: 'image/jpeg' });
    formData.append('fotos', blod);

  }

}

function enviarFormulario(formData) {


  // Configurar opciones de la solicitud Fetch
  const opcionesFetch = {
    method: 'POST', // Método HTTP para enviar los datos (en este caso, POST)
    body: formData, // Datos del formulario en formato FormData
  };


  // Realizar la solicitud Fetch
  fetch(urlApi + '/registrar-suculenta', opcionesFetch)
    .then(async (response) => {

      if (!response.ok) {

        const errorData = await response.json();
        throw errorData;

      }
      return response.json();

    })
    .then((data) => { // exito

      console.log('Respuesta del servidor:', data);

      resetForm();

      alert(data.message);


    })
    .catch((error) => { // manejo de errores

      console.error('Error al enviar la solicitud:', error);

      let mensaje = error.message;
      error.errors.forEach(item => {
        mensaje += '\n' + item
      });

      alert(mensaje);

    });


}
