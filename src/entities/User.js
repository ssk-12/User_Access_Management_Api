import { EntitySchema } from 'typeorm';

export default new EntitySchema({
    name: "User",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        username: {
            type: "varchar",
            unique: true
        },
        password: {
            type: "varchar"
        },
        role: {
            type: "enum",
            enum: ["Employee", "Manager", "Admin"],
            default: "Employee"
        },
        createdAt: {
            type: "timestamp",
            createDate: true
        },
        updatedAt: {
            type: "timestamp",
            updateDate: true
        }
    },
    relations: {
        requests: {
            type: "one-to-many",
            target: "Request",
            inverseSide: "user"
        }
    }
}); 