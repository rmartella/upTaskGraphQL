const { ApolloServer } = require('apollo-server');

const jwt = require('jsonwebtoken')
require('dotenv').config('variables.env')
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');

const conectarDB = require('./config/db');

// Conectar DB
conectarDB();

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const token = req.headers['authorization'] || '';
        //console.log(token.replace('Bearer ', ''));
        if (token) {
            try {
                const usuario = jwt.verify(token.replace('Bearer ', ''), process.env.SECRETA);
                //console.log(usuario);
                return {
                    usuario
                }
            } catch (error) {
                console.log(error);
            }
        }
    }
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`Servidor listo en la URL ${url}`);
})