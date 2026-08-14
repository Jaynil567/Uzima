export const getBackendUrl = (path) => {
  const hostname = window.location.hostname
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') || 
                  hostname.startsWith('10.') || 
                  hostname.startsWith('172.')

  if (isLocal) {
    return `http://${hostname}:8000${path}`
  } else {
    // Deployed production Vercel backend URL
    return `https://uzima-ihphtwusr-jaynilbhalani5-1923s-projects.vercel.app${path}`
  }
}
