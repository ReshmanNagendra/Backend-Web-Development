/**
 * Post Repository
 *
 * Implements the Repository Pattern for the Post entity, isolating data-access
 * logic and storage mechanisms behind a stable, standard contract.
 *
 * Storage-Swap Proof:
 * This repository is implemented using an internal Map-backed store rather than
 * an array, proving that services depend strictly on the repository contract
 * rather than any specific underlying storage technology.
 *
 * ---------------------------------------------------------------------------
 * Storage Swap Explanation (Replacing with a Prisma-backed implementation):
 * ---------------------------------------------------------------------------
 *
 * What will change:
 * 1. Internal Store:
 *    - The in-memory Map (`posts`) and manual ID generator (`nextId`) will be
 *      removed.
 *    - Database connection and persistence will be managed by the Prisma client
 *      (e.g., `const prisma = new PrismaClient()`).
 *
 * 2. Method Implementations:
 *    - findAll(): Will execute `await prisma.post.findMany()`.
 *    - findById(id): Will execute `await prisma.post.findUnique({ where: { id: Number(id) } })`.
 *    - create(fields): Will execute `await prisma.post.create({ data: fields })`.
 *    - update(id, patch): Will execute `await prisma.post.update({ where: { id: Number(id) }, data: patch })`
 *      (catching Prisma's P2025 RecordNotFound error to return null).
 *    - remove(id): Will execute `await prisma.post.delete({ where: { id: Number(id) } })`
 *      returning true, or catching P2025 and returning false.
 *
 * 3. Execution Characteristics:
 *    - Operations will become asynchronous (returning Promises), handling network
 *      I/O with the database server.
 *    - ID generation will be handled by the database schema (e.g., autoincrement sequence).
 *
 * What will remain unchanged:
 * 1. Public Interface Contract:
 *    - The repository's interface methods (findAll, findById, create, update, remove)
 *      and parameter signatures remain identical.
 *
 * 2. Return Value Shapes & Semantics:
 *    - findAll() continues returning an array of post objects (empty array if none exist).
 *    - findById(id) continues returning a post object or null if not found.
 *    - create(fields) continues returning the complete created post record with its id.
 *    - update(id, patch) continues returning the updated post record or null when not found.
 *    - remove(id) continues returning a boolean (true if deleted, false if not found).
 *
 * 3. Upper Architectural Layers:
 *    - Service Layer (`postService`): Business logic, input validation, and domain rules
 *      remain unaffected.
 *    - Controller Layer (`postController`) and Routes: Remain completely unaware of
 *      the database swap, preserving response schemas and HTTP status codes.
 */

const postStore = require('../data/postStore');

// In-memory Map-backed store (Storage-swap proof)
const posts = new Map(
  (postStore && postStore.posts ? postStore.posts : []).map((post) => [post.id, { ...post }])
);
let nextId = posts.size > 0 ? Math.max(...posts.keys()) + 1 : 1;

/**
 * Retrieve all post records.
 * Returns a new array with copies of records to prevent callers from mutating the internal store.
 * @returns {Array<Object>}
 */
function findAll() {
  return Array.from(posts.values()).map((post) => ({ ...post }));
}

/**
 * Retrieve a single post record by its ID.
 * @param {number|string} id - The ID of the post.
 * @returns {Object|null} The post record or null if not found.
 */
function findById(id) {
  const numericId = Number(id);
  const post = posts.get(numericId);
  return post ? { ...post } : null;
}

/**
 * Create a new post record with an auto-generated ID.
 * @param {Object} fields - The fields of the post to create.
 * @returns {Object} The complete created post record including its generated ID.
 */
function create(fields) {
  const id = nextId++;
  const post = {
    ...fields,
    id,
    body: fields && fields.body !== undefined ? fields.body : '',
  };
  posts.set(id, post);
  return { ...post };
}

/**
 * Update an existing post record by its ID.
 * @param {number|string} id - The ID of the post to update.
 * @param {Object} patch - The fields to update.
 * @returns {Object|null} The updated post record or null if the ID was not found.
 */
function update(id, patch) {
  const numericId = Number(id);
  const existing = posts.get(numericId);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...patch,
    id: existing.id,
  };
  posts.set(numericId, updated);
  return { ...updated };
}

/**
 * Remove a post record by its ID.
 * @param {number|string} id - The ID of the post to remove.
 * @returns {boolean} True if the record was removed, false if no record matched.
 */
function remove(id) {
  const numericId = Number(id);
  return posts.delete(numericId);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
