"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = exports.transactionContext = void 0;
const async_hooks_1 = require("async_hooks");
exports.transactionContext = new async_hooks_1.AsyncLocalStorage();
class TransactionManager {
    static async execute(prisma, dispatcher, fn) {
        let committedEvents = [];
        // 1. Execute transaction and collect events safely inside ALS
        const result = await prisma.$transaction(async (tx) => {
            const events = []; // Fresh array per retry/attempt to avoid duplicate events
            return await exports.transactionContext.run({ txClient: tx, events }, async () => {
                const res = await fn(tx);
                committedEvents = events; // Only save to outer scope if fn(tx) completes successfully
                return res;
            });
        });
        // 2. Dispatch events ONLY after the DB COMMIT succeeds
        for (const ev of committedEvents) {
            try {
                dispatcher.dispatch('telemetry.audit.log', ev);
            }
            catch (err) {
                console.error('Failed to dispatch telemetry event', err);
            }
        }
        return result;
    }
}
exports.TransactionManager = TransactionManager;
