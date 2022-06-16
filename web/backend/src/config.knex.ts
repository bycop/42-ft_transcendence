import Knex from "knex";

export const knex = Knex({
	client: 'pg',
	connection: {
		host: 'postgres',
		port: 5432,
		user: 'test1',
		password: 'test',
		database: 'transcendance'
	},
	searchPath: ['knex', 'public'],
});