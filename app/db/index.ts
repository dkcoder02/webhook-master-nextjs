import { drizzle } from 'drizzle-orm/neon-http';
import { stripeSubscriptions, stripeSubscriptionsRelations, todos, todosRelations, users, usersRelations } from './schema';

const db = drizzle(process.env.DATABASE_URL!, {
    schema: {
        users,
        todos,
        stripeSubscriptions,
        stripeSubscriptionsRelations,
        usersRelations,
        todosRelations,
    }
});

export default db;

