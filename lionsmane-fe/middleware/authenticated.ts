export default defineNuxtRouteMiddleware(async (to) => {
    const {loggedIn, login} = useOidcAuth()

    if (loggedIn.value || to.path.startsWith('/auth/')) {
        return
    }
    await login()
})
