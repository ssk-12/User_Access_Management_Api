import { EntitySchema } from 'typeorm';

export default new EntitySchema({
    name: "Request",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        accessType: {
            type: "enum",
            enum: ["Read", "Write", "Admin"]
        },
        reason: {
            type: "text"
        },
        status: {
            type: "enum",
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
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
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: true
        },
        software: {
            type: "many-to-one",
            target: "Software",
            joinColumn: true
        },
        updatedBy: {
            type: "many-to-one",
            target: "User",
            joinColumn: {
                name: "updated_by_id"
            },
            nullable: true
        }
    }
}); 