export default defineNuxtRouteMiddleware(async () => {
    const { loggedIn, login } = useOidcAuth()

    // redirect the user to the login screen if they're not authenticated
    if (!loggedIn.value) {
        await login()
    }
})
