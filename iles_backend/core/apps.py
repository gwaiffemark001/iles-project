from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = "core"

    def ready(self):
        from . import signals  # noqa: F401

"""
/*
// alternative code
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (isAuthenticated === false) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}
*/
"""