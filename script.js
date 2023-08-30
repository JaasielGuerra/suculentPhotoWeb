const botonesFoto = document.querySelectorAll('.btn-foto');
const botonesCargarFoto = document.querySelectorAll('.btn-cargar-foto');
//const urlApi = 'http://localhost:8080'
const urlApi = 'https://routersuculentapi-production.up.railway.app'
const estadoSaludable = document.getElementById('estadoSalud1');
const estadoEnferma = document.getElementById('estadoSalud2');
const selectSintomas = document.getElementById('sintoma');
const consejo = document.getElementById('consejo');
const formulario = document.getElementById('form-fotos');
const tipoFoto = document.getElementById('foto');
const tipoArchivo = document.getElementById('archivo');

const botonCapturarFoto = document.getElementById('capture-btn');
let stream; // Variable para almacenar el flujo de la cámara
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const photoElement = document.getElementById('photo');
const botonAceptarCapturaFoto = document.getElementById('btn-aceptar-foto');
const modalFoto = document.getElementById('modalFoto')

const inputImage = document.getElementById('inputImage');
const image = document.getElementById('image');
const cropButton = document.getElementById('cropButton');

//para recortar imagenes subidas
let cropper;

// fotos tomadas
let fotosTomadas = {};
let idBotonActualTomarFoto = '';
let contadorFotos = 0;

//evento seleccion tipo imagen
tipoFoto.addEventListener('change', e => alternarTipoImagenCapturar(e.target))
tipoArchivo.addEventListener('change', e => alternarTipoImagenCapturar(e.target))

function alternarTipoImagenCapturar(radio) {

  console.log(radio.value);

  resetCapturaFotos();

  if (radio.value === 'ARCHIVO') {

    document.getElementById('pnl-tomar-fotos').hidden = true;
    document.getElementById('pnl-subir-archivo').hidden = false;

  } else {
    document.getElementById('pnl-tomar-fotos').hidden = false;
    document.getElementById('pnl-subir-archivo').hidden = true;
  }
}

// agregar eventos a los botones de tomar fotos
botonesFoto.forEach(boton => {
  boton.addEventListener('click', e => accionModalTomarFoto(boton))
});

// agregar eventos a los botones de cargar fotos desde archivo
botonesCargarFoto.forEach(boton => {
  boton.addEventListener('click', e => accionLevantarModalCargarFoto(boton))
});

// evento para la carga de archivo imagen
inputImage.addEventListener('change', cargarImagenParaRecorte);

//evento para recortar imagen
cropButton.addEventListener('click', recortarImagenPlanta);

//eventos para captura foto y aceptar captura modal
botonCapturarFoto.addEventListener('click', e => takePhoto());
botonAceptarCapturaFoto.addEventListener('click', e => aceptarCapturaFotoModal());

//evento cuando se cierra el modal
modalFoto.addEventListener('hidden.bs.modal', event => {
  stopCamera();
})

//evento estado de salud
estadoSaludable.addEventListener('change', e => alternarEstadoSalud(e.target))
estadoEnferma.addEventListener('change', e => alternarEstadoSalud(e.target))

function alternarEstadoSalud(radio) {
  console.log(radio.value);

  if (radio.value === 'SALUDABLE') {

    selectSintomas.hidden = true
    consejo.hidden = true
    document.getElementById('label-consejo').hidden = true

  } else {

    selectSintomas.hidden = false
    consejo.hidden = false
    document.getElementById('label-consejo').hidden = false
  }

}


//evento submit formulario
formulario.addEventListener('submit', e => enviarFormularioServicio(e));

async function accionModalTomarFoto(botonClicado) {

  let loading = document.getElementById('loading-modal');
  loading.classList.remove('d-none');


  console.log('Tomar foto boton ' + botonClicado.getAttribute('id'));
  idBotonActualTomarFoto = botonClicado.getAttribute('id');

  contadorFotos = 1;
  botonCapturarFoto.innerText = 'Capturar Foto (No. ' + contadorFotos + ')';
  fotosTomadas = {};

  try {

    const constraints = {
      video: {
        facingMode: 'environment', // Intentar usar la cámara trasera (si está disponible)
        width: { ideal: 1200 },  // Ancho ideal del video
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

function accionLevantarModalCargarFoto(botonClicado) {

  console.log('Subir foto boton ' + botonClicado.getAttribute('id'));
  idBotonActualTomarFoto = botonClicado.getAttribute('id');

  image.hidden = true;
  inputImage.hidden = false;

  if (cropper) {
    cropper.destroy(); // Destroy the Cropper instance
    cropper = null;
  }
  image.src = ''; // Clear the image source
  inputImage.value = ''; // Clear the input file selection

}

function cargarImagenParaRecorte(event) {
  const file = event.target.files[0];
  if (file) {

    const reader = new FileReader();

    reader.onload = function (e) {

      image.src = e.target.result;
      image.hidden = false;
      inputImage.hidden = true;

      // Initialize Cropper.js once the image is loaded
      image.onload = function () {

        cropper = new Cropper(image, {
          aspectRatio: 1, // Square aspect ratio
          minCropBoxWidth: 200,
          minCropBoxHeight: 200
        });

      };
    };

    reader.readAsDataURL(file);
  }
}

function recortarImagenPlanta() {

  // Get the cropped image as a Blob
  const croppedImageBlob = cropper.getCroppedCanvas({
    with: 400,
    height: 400
  }).toBlob(function (imageBlob) {

    // aqui se tiene el objeto Blob de la imagen capturada
    // se agrega al arreglo de fotos
    fotosTomadas[idBotonActualTomarFoto] = imageBlob;
    console.log(fotosTomadas);

    cambiarColorBotonFotoTomada();


  });
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

      fotosTomadas[contadorFotos++] = blob;
      console.log(fotosTomadas);
      botonCapturarFoto.innerText = 'Capturar Foto (No. ' + contadorFotos + ')';

  }, 'image/jpeg', 1); // Calidad JPG de 100%

   
    //mostrar el de aceptar
    botonAceptarCapturaFoto.style.display = 'block'; 

}


// Función para detener la cámara
function stopCamera() {
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
  }
}

function aceptarCapturaFotoModal() {

  // Detener la cámara y liberar recursos
  stopCamera();

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

  resetCapturaFotos();

  tipoFoto.checked = true;
  document.getElementById('pnl-tomar-fotos').hidden = false;
  document.getElementById('pnl-subir-archivo').hidden = true;
  image.hidden = true;
  inputImage.hidden = false;
  estadoEnferma.checked = true;
  selectSintomas.selectedIndex = 0;
  consejo.value = '';

  let loadingPage = document.getElementById('loading-page');
  loadingPage.classList.add('d-none');

  let contenMain = document.getElementById('content-main');
  contenMain.classList.remove('d-none');


}

function resetCapturaFotos() {

  fotosTomadas = {};
  idBotonActualTomarFoto = '';
  contadorFotos = 0;
  botonesFoto.forEach(btn => {
    btn.classList.remove('btn-success');
    btn.classList.add('btn-warning');
  });

  botonesCargarFoto.forEach(btn => {
    btn.classList.remove('btn-success');
    btn.classList.add('btn-warning');
  });
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
