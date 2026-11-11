/** Only the kernel dependencies are doubled; tests invoke the actual S14 modules. */
export const state = {
  authCalls: 0,
  editorialCalls: /** @type {string[]} */ ([]),
  dependencyLoads: /** @type {string[]} */ ([]),
};

/** @type {Error | null} */
let authError = null;

export function reset() {
  state.authCalls = 0;
  state.editorialCalls.length = 0;
  authError = null;
}

/** @param {Error} error */
export function rejectAuthentication(error) {
  authError = error;
}

export async function requireStaff() {
  state.authCalls += 1;
  if (authError) throw authError;
  return { userId: "retirement-test-admin", role: "admin" };
}

/** @param {string} name */
function editorialCall(name) {
  state.editorialCalls.push(name);
  throw new Error(`Unexpected editorial dependency: ${name}`);
}

export const loadTranslationRows = () => editorialCall("loadTranslationRows");
export const setTargetTranslation = () => editorialCall("setTargetTranslation");
export const setTranslationState = () => editorialCall("setTranslationState");
export const deleteTranslation = () => editorialCall("deleteTranslation");
export const getTranslateProvider = () => editorialCall("getTranslateProvider");
export const hashSource = () => editorialCall("hashSource");
export const revalidatePath = () => editorialCall("revalidatePath");
export const updateTag = () => editorialCall("updateTag");
export const cacheTags = {
  entity: () => editorialCall("cacheTags.entity"),
  list: () => editorialCall("cacheTags.list"),
};
