import { drizzle } from 'drizzle-orm/neon-http';
import { todos, todosRelations, users, usersRelations } from './schema';

const db = drizzle(process.env.DATABASE_URL!, {
    schema: {
        users,
        todos,
        usersRelations,
        todosRelations,
    }
});

export default db;

