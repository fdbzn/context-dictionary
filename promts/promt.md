## Getting Started
Ayudame a crear un appweb para estudiar ingles
## Goals
1.crear una lista de frases
  1.2. dentro de cada frase, existira una palabra o frase que sera la palabra o frase a aprender(tagtolearn)
    1.2.1. Dentro de cada tagtolearn mostraremos a modo de tooltip su significado(si lo tienen)
  1.3. cada frase tendra una definicion o explicacion de la misma
2.Existira un modo de estudio, iniciado por un boton que iniciara el estudio de las frases
  2.1. El estudio de las frases se iniciara mostrando una frase y el usuario podra mostrar su significado con un boton, ademas tendra que ingresar un nuevo ejemplo de como usar esa palabra o frase(tagtolearn)
3.Cada que muestre su significado tendra que marcar si fue correcto o no, esto servira mas adelante para tener un score de cual es la frase que mas a tenido errores, asi la siguiente vez que se inicie el modo estudio se mostrara la frase con mas errores para que el usuario pueda corregirla
4. antes de iniciar el usuario debe tener configurado en "opciones" el numero de frases que desea estudiar
5. Denemos de mostrar con un marco agradable una imagen que nos ayude a dar el contexto de la frase o palabra mostrada

## Modulos 
1.Tendremos un modulo que permita crear la palabra o frase en la base de datos
  1.1.al registrarla podremos hacer lo siguiente, enmarcar como en un editor al poner "bold" para seleccionar la palabra o frase a aprender(tagtolear)
  1.2.Se debe poder agregar el significado de toda la frase 
  1.3.Conectar con la API de Pixabay para obtener imagenes relacionadas con la palabra o frase, agregando un buscador
  1.4.Se deden de poder agregar varias frases o palabras a la base de datos al mismo tiempo, y tambien se deben poder editar o eliminar las que ya existen
  1.5.Estas palabras o frases se deben poder autoguardar
2.Modulo para hacer login 
3.Modulo para registro de usuarios
4.Home con estadisticas del usuario, frases aprendidas, errores cometidos, frases a aprender, dias de estudio.

## Arquitectura
DB: conexion a supabase
Conexiones: Via API sin usar server actions
Imagenes via api: Pixabay API
