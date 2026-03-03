import LegalPageLayout from "./LegalPageLayout";

export default function Privacidad() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      subtitle="Cómo recopilamos, usamos y protegemos tu información personal"
      lastUpdated="03 de marzo de 2026"
    >
      <div className="highlight-box">
        <p style={{ marginBottom: 0 }}>
          En Red Level Circle nos comprometemos a proteger tu privacidad. Esta Política de
          Privacidad describe cómo recopilamos, utilizamos y protegemos la información que nos
          proporcionas al usar nuestra Plataforma. Al registrarte, aceptas el tratamiento de tus
          datos conforme a lo aquí descrito.
        </p>
      </div>

      <h2>1. Responsable del Tratamiento</h2>
      <p>
        El responsable del tratamiento de tus datos personales es Red Level Circle, operador de la
        plataforma de esports y gaming accesible en este dominio. Para cualquier consulta sobre
        privacidad, puedes contactarnos a través de los canales oficiales disponibles en la
        Plataforma.
      </p>

      <h2>2. Datos que Recopilamos</h2>
      <p>Recopilamos los siguientes tipos de información:</p>

      <h3>2.1 Datos proporcionados directamente</h3>
      <ul>
        <li><strong>Datos de registro:</strong> nombre, apellido, nickname, correo electrónico, país y contraseña (almacenada en formato hash cifrado).</li>
        <li><strong>Datos de perfil:</strong> avatar, descripción, juego principal, rango, rol competitivo y otra información que decidas añadir voluntariamente.</li>
        <li><strong>Contenido generado:</strong> publicaciones, comentarios, participaciones en torneos y cualquier otro contenido que publiques en la Plataforma.</li>
      </ul>

      <h3>2.2 Datos recopilados automáticamente</h3>
      <ul>
        <li><strong>Datos de uso:</strong> páginas visitadas, torneos consultados, tiempo de sesión y acciones realizadas en la Plataforma.</li>
        <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y dispositivo.</li>
        <li><strong>Cookies y tecnologías similares:</strong> tal como se describe en nuestra Política de Cookies.</li>
      </ul>

      <h2>3. Finalidades del Tratamiento</h2>
      <p>Utilizamos tus datos para las siguientes finalidades:</p>

      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gestionar tu cuenta y autenticación</td>
            <td>Ejecución del contrato (uso de la Plataforma)</td>
          </tr>
          <tr>
            <td>Personalizar tu experiencia en la Plataforma</td>
            <td>Interés legítimo / Consentimiento</td>
          </tr>
          <tr>
            <td>Gestionar torneos, equipos y recompensas</td>
            <td>Ejecución del contrato</td>
          </tr>
          <tr>
            <td>Enviar comunicaciones sobre la Plataforma</td>
            <td>Consentimiento / Interés legítimo</td>
          </tr>
          <tr>
            <td>Mejorar y analizar el uso de la Plataforma</td>
            <td>Interés legítimo</td>
          </tr>
          <tr>
            <td>Cumplir obligaciones legales</td>
            <td>Obligación legal</td>
          </tr>
          <tr>
            <td>Prevenir fraude y garantizar la seguridad</td>
            <td>Interés legítimo / Obligación legal</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Compartición de Datos con Terceros</h2>
      <p>
        Red Level Circle no vende ni alquila tus datos personales a terceros. Podemos compartir
        información en los siguientes casos:
      </p>
      <ul>
        <li><strong>Proveedores de servicios:</strong> empresas que nos ayudan a operar la Plataforma (hosting, análisis, correo electrónico), bajo acuerdos de confidencialidad y tratamiento de datos.</li>
        <li><strong>Aliados y patrocinadores:</strong> únicamente datos agregados y anonimizados, nunca información personal identificable, salvo consentimiento expreso.</li>
        <li><strong>Obligaciones legales:</strong> cuando sea requerido por ley, orden judicial o autoridad competente.</li>
        <li><strong>Protección de derechos:</strong> cuando sea necesario para proteger los derechos, propiedad o seguridad de Red Level Circle, sus usuarios u otros.</li>
      </ul>

      <h2>5. Transferencias Internacionales de Datos</h2>
      <p>
        La Plataforma puede utilizar servicios de infraestructura alojados en distintos países.
        En caso de transferencias internacionales de datos, nos aseguramos de que se apliquen
        las garantías adecuadas conforme a la normativa de protección de datos aplicable.
      </p>

      <h2>6. Conservación de Datos</h2>
      <p>
        Conservamos tus datos personales durante el tiempo que tu cuenta esté activa o sea
        necesario para prestarte los servicios. Una vez que solicites la eliminación de tu cuenta,
        procederemos a eliminar o anonimizar tus datos en un plazo razonable, salvo que debamos
        conservarlos por obligación legal.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos contra
        acceso no autorizado, pérdida, destrucción o divulgación. Las contraseñas se almacenan
        utilizando algoritmos de hash seguros (bcrypt). Sin embargo, ningún sistema es completamente
        infalible, por lo que te recomendamos usar contraseñas seguras y únicas.
      </p>

      <h2>8. Tus Derechos</h2>
      <p>
        De acuerdo con la normativa aplicable, tienes los siguientes derechos sobre tus datos
        personales:
      </p>
      <ul>
        <li><strong>Acceso:</strong> obtener confirmación de si tratamos tus datos y acceder a ellos.</li>
        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
        <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y legible por máquina.</li>
        <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
        <li><strong>Limitación:</strong> solicitar la restricción del tratamiento en ciertos casos.</li>
        <li><strong>Retirar el consentimiento:</strong> cuando el tratamiento se base en tu consentimiento, puedes retirarlo en cualquier momento.</li>
      </ul>
      <p>
        Para ejercer estos derechos, contáctanos a través de los canales oficiales de la Plataforma.
        Responderemos a tu solicitud en el plazo establecido por la normativa aplicable.
      </p>

      <h2>9. Menores de Edad</h2>
      <p>
        La Plataforma no está dirigida a menores de 13 años. Si eres menor de 13 años, no debes
        registrarte ni proporcionar información personal. Si tenemos conocimiento de que hemos
        recopilado datos de un menor sin el consentimiento parental adecuado, procederemos a
        eliminar dicha información.
      </p>

      <h2>10. Cambios en esta Política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos de cambios
        significativos mediante un aviso en la Plataforma o por correo electrónico. Te recomendamos
        revisar esta página regularmente.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier consulta, solicitud o reclamación relacionada con el tratamiento de tus datos
        personales, puedes contactarnos a través de los canales oficiales disponibles en la
        Plataforma.
      </p>
    </LegalPageLayout>
  );
}
