import type { Ticket } from "@/data/types";
import { OS_TYPE_LABELS, PRIORITY_LABELS, TICKET_STATUS_LABELS } from "@/data/types";

interface TicketPrintSheetProps {
  ticket: Ticket;
  assetLabel: string;
  parts: { name: string; quantity: number }[];
}

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export function TicketPrintSheet({ ticket, assetLabel, parts }: TicketPrintSheetProps) {
  const ticketCode = ticket.code ? `OS-${String(ticket.code).padStart(4, "0")}` : "Chamado";
  const maintenanceLabel = ticket.maintenanceType === "mechanical" ? "Mecânica" : "Elétrica";

  return (
    <article className="ticket-print-sheet" aria-hidden="true">
      <header className="ticket-print-header">
        <div>
          <p className="ticket-print-kicker">Aplicativo de Manutenção</p>
          <h1>Ordem de Serviço</h1>
        </div>
        <div className="ticket-print-code">
          <span>Número</span>
          <strong>{ticketCode}</strong>
        </div>
      </header>

      <section className="ticket-print-summary">
        <div><span>Equipamento</span><strong>{assetLabel}</strong></div>
        <div><span>Status</span><strong>{TICKET_STATUS_LABELS[ticket.status]}</strong></div>
        <div><span>Prioridade</span><strong>{PRIORITY_LABELS[ticket.priority]}</strong></div>
        <div>
          <span>Tipo</span>
          <strong>{OS_TYPE_LABELS[ticket.type]}{ticket.type === "corrective" && ticket.maintenanceType ? ` · ${maintenanceLabel}` : ""}</strong>
        </div>
      </section>

      <section className="ticket-print-section">
        <h2>Solicitação</h2>
        <div className="ticket-print-grid">
          <div><span>Aberto por</span><p>{ticket.reportedBy || ticket.createdBy || "—"}</p></div>
          <div><span>Data de abertura</span><p>{formatDateTime(ticket.createdAt)}</p></div>
          <div><span>Data de conclusão</span><p>{formatDateTime(ticket.resolvedAt)}</p></div>
          <div><span>Horas trabalhadas</span><p>{ticket.actualHours != null ? `${ticket.actualHours} h` : "—"}</p></div>
        </div>
        <div className="ticket-print-description">
          <span>Descrição / Sintoma</span>
          <p>{ticket.symptom}</p>
        </div>
      </section>

      {ticket.comment && (
        <section className="ticket-print-section">
          <h2>Serviço executado</h2>
          <p className="ticket-print-text">{ticket.comment}</p>
        </section>
      )}

      {parts.length > 0 && (
        <section className="ticket-print-section">
          <h2>Peças utilizadas</h2>
          <table>
            <thead><tr><th>Descrição</th><th>Quantidade</th></tr></thead>
            <tbody>
              {parts.map((part, index) => (
                <tr key={`${part.name}-${index}`}><td>{part.name}</td><td>{part.quantity}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(ticket.photoUrl || ticket.resolutionPhotoUrl) && (
        <section className="ticket-print-section ticket-print-evidence">
          <h2>Registros fotográficos</h2>
          <div>
            {ticket.photoUrl && !/\.(mp4|webm|mov)$/i.test(ticket.photoUrl) && (
              <figure><img src={ticket.photoUrl} alt="Registro da solicitação" /><figcaption>Solicitação</figcaption></figure>
            )}
            {ticket.resolutionPhotoUrl && !/\.(mp4|webm|mov)$/i.test(ticket.resolutionPhotoUrl) && (
              <figure><img src={ticket.resolutionPhotoUrl} alt="Registro da conclusão" /><figcaption>Conclusão</figcaption></figure>
            )}
          </div>
        </section>
      )}

      <footer className="ticket-print-signatures">
        <div><span>Responsável pela execução</span></div>
        <div><span>Validação do serviço</span></div>
      </footer>
    </article>
  );
}