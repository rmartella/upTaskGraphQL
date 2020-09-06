const Usuario = require('../models/Usuario')
const Proyecto = require('../models/Proyecto')
const Tarea = require('../models/Tarea')
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre } = usuario;
    return jwt.sign({ id, email, nombre }, secreta, { expiresIn });
}

const resolvers = {
    Query: {
        obtenerProyectos: async (_, { }, ctx) => {
            const proyectos = await Proyecto.find({ creador: ctx.usuario.id });
            return proyectos;
        },
        obtenerTareas: async (_, { input }, ctx) => {
            const tareas = await Tarea.find({ creador: ctx.usuario.id }).where('proyecto').equals(input.proyecto);
            return tareas;
        }
    },
    Mutation: {
        crearUsuario: async (_, { input }) => {
            const { email, password } = input;
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if (existeUsuario)
                throw new Error('El usuario ya está registrado');

            try {

                //Hashear password
                const salt = await bcryptjs.genSalt(10);
                input.password = await bcryptjs.hash(password, salt);
                //console.log(input);

                const nuevoUsuario = new Usuario(input);
                //console.log(nuevoUsuario);
                nuevoUsuario.save();
                return "Usuario creado correctamente";
            }
            catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;

            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });

            // Si el usuario existe
            if (!existeUsuario)
                throw new Error('El usuario no existe');


            // Si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto)
                throw new Error('Password incorrecto');

            // Dar acceso a la app
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '4hr')
            }
        },
        nuevoProyecto: async (_, { input }, ctx) => {
            try {
                const proyecto = new Proyecto(input);

                //console.log(ctx.usuario);
                // Asociar el creador
                proyecto.creador = ctx.usuario.id;

                // Almacenar en la BD
                const resultado = await proyecto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProyecto: async (_, { id, input }, ctx) => {
            // Revisar si el proyecto existe
            let proyecto = await Proyecto.findById(id);
            console.log(proyecto);
            if (!proyecto)
                throw new Error('Proyecto no encontrado');

            // Revisar que si la persona que trata de editarlo es el creador
            if (proyecto.creador.toString() !== ctx.usuario.id)
                throw new Error('No tienes las credenciales para editar');

            // Guardar el proyecto
            proyecto = await Proyecto.findByIdAndUpdate({ _id: id }, input, { new: true });
            return proyecto;
        },
        eliminarProyecto: async (_, { id }, ctx) => {
            let proyecto = await Proyecto.findById(id);
            console.log(proyecto);
            if (!proyecto)
                throw new Error('Proyecto no encontrado');

            // Revisar que si la persona que trata de editarlo es el creador
            if (proyecto.creador.toString() !== ctx.usuario.id)
                throw new Error('No tienes las credenciales para editar');

            // Eliminar
            await Proyecto.findOneAndDelete({ _id: id });

            return "Proyecto eliminado";
        },
        nuevaTarea: async (_, { input }, ctx) => {
            try {
                const tarea = new Tarea(input);
                tarea.creador = ctx.usuario.id;
                const resultado = await tarea.save();
                return resultado;
            }
            catch (error) {
                console.log(error);
            }
        },
        actualizarTarea: async (_, { id, input, estado }, ctx) => {
            //console.log(id);
            // Si la tarea existe o no
            let tarea = await Tarea.findById(id);

            if (!tarea)
                throw new Error('Tarea no encontrada');

            // Si la persona que edita es el creador
            if (tarea.creador.toString() !== ctx.usuario.id)
                throw new Error('No tienes las credenciales para editar');

            // Asignar estado
            input.estado = estado;

            // Guardar y retornar la tarea
            tarea = await Tarea.findOneAndUpdate({ _id: id }, input, { new: true });
            return tarea;
        },
        eliminarTarea: async (_, { id }, ctx) => {
            // Si la tarea existe o no
            let tarea = await Tarea.findById(id);

            if (!tarea)
                throw new Error('Tarea no encontrada');

            // Si la persona que está eliminadno es el creador
            if (tarea.creador.toString() !== ctx.usuario.id)
                throw new Error('No tienes las credenciales para editar');

            // Eliminar
            await Tarea.findOneAndDelete({ _id: id });
            return "Tarea Eliminada";
        }
    }
}

module.exports = resolvers;