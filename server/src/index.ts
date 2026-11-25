import { app } from './app';

const port = Number(process.env.PORT) || 3001;
app.listen(port);

console.log(`OMOO Elysia Backend running at http://localhost:${port}`);
console.log(`Swagger API Documentation available at http://localhost:${port}/swagger`);
