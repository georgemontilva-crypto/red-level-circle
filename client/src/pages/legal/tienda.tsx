import LegalPageLayout from "./LegalPageLayout";

export default function Tienda() {
  return (
    <LegalPageLayout
      title="Políticas de Tienda y Recompensas"
      subtitle="Condiciones de compra, uso de moneda virtual y sistema de recompensas"
      lastUpdated="03 de marzo de 2026"
    >
      <div className="highlight-box">
        <p style={{ marginBottom: 0 }}>
          Esta política regula las condiciones de compra en la Tienda de Red Level Circle, el uso
          de la moneda virtual de la Plataforma y el sistema de recompensas. Al realizar cualquier
          compra o canjear recompensas, aceptas estas condiciones.
        </p>
      </div>

      <h2>1. La Tienda de Red Level Circle</h2>
      <p>
        La Tienda de Red Level Circle ofrece artículos digitales como cosméticos, marcos de perfil,
        efectos visuales y otros elementos virtuales que mejoran la experiencia en la Plataforma.
        Todos los artículos disponibles en la Tienda son de naturaleza exclusivamente digital y no
        tienen equivalencia en bienes físicos.
      </p>

      <h2>2. Moneda Virtual (Créditos RLC)</h2>
      <p>
        La Plataforma puede incluir un sistema de moneda virtual denominado "Créditos RLC" u otro
        nombre que se designe en la Plataforma. Esta moneda virtual:
      </p>
      <ul>
        <li>No tiene valor monetario real ni puede ser canjeada por dinero en efectivo.</li>
        <li>No es transferible entre usuarios, salvo que se indique expresamente lo contrario.</li>
        <li>Puede obtenerse mediante la participación en torneos, completando misiones o a través de compras en la Tienda.</li>
        <li>Puede expirar o ser ajustada por Red Level Circle en cualquier momento, con previo aviso cuando sea posible.</li>
        <li>No está garantizada su disponibilidad indefinida; Red Level Circle puede modificar o discontinuar el sistema de moneda virtual.</li>
      </ul>

      <h2>3. Proceso de Compra</h2>
      <p>
        Para realizar compras en la Tienda es necesario tener una cuenta activa en la Plataforma.
        El proceso de compra se realiza íntegramente dentro de la Plataforma. Antes de confirmar
        cualquier compra, se mostrará un resumen del artículo y su precio. La confirmación de la
        compra es definitiva.
      </p>
      <p>
        En caso de que la Plataforma integre métodos de pago con dinero real en el futuro, se
        publicarán condiciones específicas adicionales para dichas transacciones.
      </p>

      <h2>4. Política de No Reembolso</h2>
      <p>
        Todas las compras de artículos digitales en la Tienda son <strong>finales e irrevocables</strong>.
        Una vez que un artículo digital ha sido entregado a tu cuenta, no procede devolución ni
        reembolso, salvo en los siguientes casos excepcionales:
      </p>
      <ul>
        <li>Error técnico demostrable que haya impedido la entrega del artículo adquirido.</li>
        <li>Cargo duplicado por error del sistema.</li>
        <li>Compra realizada de forma fraudulenta sin tu consentimiento (debes notificarlo de inmediato).</li>
      </ul>
      <p>
        Para solicitar una revisión por alguno de estos motivos, contacta con el equipo de soporte
        de Red Level Circle a través de los canales oficiales, indicando el detalle de la transacción.
      </p>

      <h2>5. Sistema de Recompensas</h2>
      <p>
        El sistema de recompensas de Red Level Circle permite a los usuarios obtener puntos o
        artículos especiales mediante la realización de misiones, la participación en torneos,
        la actividad en la comunidad y otras acciones dentro de la Plataforma.
      </p>

      <h3>5.1 Obtención de Recompensas</h3>
      <p>
        Las recompensas se otorgan automáticamente al completar los requisitos de cada misión o
        evento. Los criterios de elegibilidad y los plazos se especifican en la descripción de
        cada misión o evento.
      </p>

      <h3>5.2 Canje de Recompensas</h3>
      <p>
        Los puntos de recompensa pueden canjearse por artículos disponibles en la sección de
        recompensas de la Tienda. El canje es definitivo e irreversible. Los artículos canjeados
        no pueden devolverse ni convertirse de nuevo en puntos.
      </p>

      <h3>5.3 Caducidad y Modificaciones</h3>
      <p>
        Red Level Circle se reserva el derecho de modificar, ajustar o discontinuar el sistema
        de recompensas, incluyendo los puntos acumulados, con un aviso previo razonable cuando
        sea posible. Los puntos de recompensa pueden tener fecha de caducidad, que se indicará
        en la Plataforma.
      </p>

      <h2>6. Artículos Exclusivos y Ediciones Limitadas</h2>
      <p>
        Algunos artículos de la Tienda pueden ser de edición limitada o exclusivos de determinados
        eventos. La disponibilidad de estos artículos no está garantizada más allá del período
        indicado. Una vez agotados o expirado el período de disponibilidad, no podrán adquirirse.
      </p>

      <h2>7. Modificaciones de la Tienda</h2>
      <p>
        Red Level Circle puede añadir, modificar o retirar artículos de la Tienda en cualquier
        momento. Los precios de los artículos pueden cambiar sin previo aviso, aunque los cambios
        no afectarán a compras ya realizadas.
      </p>

      <h2>8. Uso Fraudulento</h2>
      <p>
        Cualquier intento de manipular el sistema de compras, recompensas o moneda virtual mediante
        exploits, bugs, herramientas de terceros u otros medios no autorizados resultará en la
        suspensión o cancelación de la cuenta, así como la anulación de los artículos o puntos
        obtenidos de forma fraudulenta.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para consultas sobre compras, recompensas o cualquier incidencia relacionada con la Tienda,
        contacta con el equipo de soporte de Red Level Circle a través de los canales oficiales
        disponibles en la Plataforma.
      </p>
    </LegalPageLayout>
  );
}
