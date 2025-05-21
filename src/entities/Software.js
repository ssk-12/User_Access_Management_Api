import { EntitySchema } from 'typeorm';

export default new EntitySchema({
    name: "Software",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        name: {
            type: "varchar",
            unique: true
        },
        description: {
            type: "text"
        },
        accessLevels: {
            type: "simple-array",
            default: ["Read"]
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
            inverseSide: "software"
        }
    }
}); 