import LegalPageLayout from "./LegalPageLayout";

export default function Cookies() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      subtitle="Información sobre el uso de cookies y tecnologías similares"
      lastUpdated="03 de marzo de 2026"
    >
      <div className="highlight-box">
        <p style={{ marginBottom: 0 }}>
          Red Level Circle utiliza cookies y tecnologías similares para garantizar el correcto
          funcionamiento de la Plataforma, mejorar tu experiencia y analizar el uso del servicio.
          Esta política explica qué son las cookies, qué tipos utilizamos y cómo puedes gestionarlas.
        </p>
      </div>

      <h2>1. ¿Qué son las Cookies?</h2>
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador,
        tablet, teléfono móvil) cuando visitas un sitio web. Permiten que el sitio recuerde tus
        acciones y preferencias durante un período de tiempo, para que no tengas que volver a
        introducirlas cada vez que visites el sitio o navegues de una página a otra.
      </p>
      <p>
        Además de las cookies, podemos utilizar tecnologías similares como el almacenamiento local
        del navegador (localStorage/sessionStorage) para guardar información de sesión y preferencias.
      </p>

      <h2>2. Tipos de Cookies que Utilizamos</h2>

      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre / Identificador</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Esencial</strong></td>
            <td>session_token (rlc_session)</td>
            <td>Mantiene tu sesión iniciada en la Plataforma</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td><strong>Preferencia</strong></td>
            <td>theme, locale</td>
            <td>Recuerda tus preferencias de tema e idioma</td>
            <td>Persistente</td>
          </tr>
          <tr>
            <td><strong>Analítica</strong></td>
            <td>_analytics</td>
            <td>Análisis de uso y rendimiento de la Plataforma (datos anonimizados)</td>
            <td>Sesión / 30 días</td>
          </tr>
          <tr>
            <td><strong>Seguridad</strong></td>
            <td>csrf_token</td>
            <td>Protección contra ataques CSRF</td>
            <td>Sesión</td>
          </tr>
        </tbody>
      </table>

      <h3>2.1 Cookies Esenciales</h3>
      <p>
        Estas cookies son imprescindibles para el funcionamiento de la Plataforma. Sin ellas, no
        podrías iniciar sesión, navegar entre páginas o utilizar funcionalidades básicas. No
        requieren tu consentimiento previo, ya que son necesarias para la prestación del servicio.
      </p>

      <h3>2.2 Cookies de Preferencia</h3>
      <p>
        Permiten que la Plataforma recuerde tus elecciones (como el tema visual o el idioma) para
        ofrecerte una experiencia más personalizada. Puedes desactivarlas, aunque esto puede afectar
        a algunas funcionalidades.
      </p>

      <h3>2.3 Cookies de Analítica</h3>
      <p>
        Nos ayudan a entender cómo los usuarios interactúan con la Plataforma, qué páginas son más
        visitadas y cómo podemos mejorar el servicio. Los datos recopilados son agregados y
        anonimizados, por lo que no permiten identificarte directamente.
      </p>

      <h3>2.4 Cookies de Seguridad</h3>
      <p>
        Se utilizan para proteger la Plataforma y a sus usuarios de ataques y accesos no autorizados.
        Son esenciales para mantener la integridad y seguridad del servicio.
      </p>

      <h2>3. Cookies de Terceros</h2>
      <p>
        Algunos servicios integrados en la Plataforma, como Google Sign-In o herramientas de
        análisis, pueden establecer sus propias cookies. Estas cookies están sujetas a las
        políticas de privacidad de los respectivos terceros, sobre las cuales Red Level Circle
        no tiene control directo.
      </p>

      <h2>4. Cómo Gestionar las Cookies</h2>
      <p>
        Puedes controlar y gestionar las cookies de las siguientes formas:
      </p>
      <ul>
        <li>
          <strong>Configuración del navegador:</strong> La mayoría de los navegadores te permiten
          ver, gestionar, bloquear y eliminar cookies. Consulta la sección de ayuda de tu navegador
          para más información.
        </li>
        <li>
          <strong>Herramientas de opt-out de terceros:</strong> Algunos proveedores de analítica
          ofrecen herramientas específicas para optar por no participar en la recopilación de datos.
        </li>
      </ul>
      <p>
        Ten en cuenta que bloquear o eliminar cookies puede afectar al funcionamiento de la
        Plataforma, especialmente las funcionalidades que requieren autenticación.
      </p>

      <h2>5. Cambios en esta Política</h2>
      <p>
        Podemos actualizar esta Política de Cookies para reflejar cambios en las tecnologías que
        utilizamos o en la normativa aplicable. Te notificaremos de cambios significativos mediante
        un aviso en la Plataforma.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Si tienes preguntas sobre el uso de cookies en Red Level Circle, puedes contactarnos a
        través de los canales oficiales disponibles en la Plataforma.
      </p>
    </LegalPageLayout>
  );
}
