/* Column — a single board column (할일 / 진행중 / 완료) */

import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { PostIt } from "./PostIt.jsx";
import { AddCard } from "./AddCard.jsx";

export const Column = ({ column, cards, users, onCardClick, onAddCard, drag }) => {
  const [isOver, setIsOver] = useState(false);

  const icon = column.id === "todo"
    ? <Icon name="square-pink" size={20} />
    : column.id === "doing"
      ? <Icon name="square-yellow" size={20} />
      : <Icon name="check-square-green" size={20} />;

  return (
    <div
      className={"column" + (isOver ? " dragover" : "")}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        drag.onDrop(column.id);
      }}
    >
      <div className="column-header">
        {icon}
        <span className="column-title">{column.title}</span>
        <span className="column-count">{cards.length}</span>
        <button className="icon-btn" title="옵션">
          <Icon name="more" size={16} />
        </button>
      </div>

      <div className="cards">
        {cards.map(card => (
          <PostIt
            key={card.id}
            card={card}
            users={users}
            onClick={onCardClick}
            onDragStart={drag.onDragStart}
            onDragEnd={drag.onDragEnd}
            isDragging={drag.draggingId === card.id}
            isDropGhost={false}
          />
        ))}
        {cards.length === 0 && (
          <div className="empty-hint">여기에 작업을 추가하거나 끌어 놓으세요.</div>
        )}
      </div>

      <AddCard onAdd={onAddCard} columnId={column.id} />
    </div>
  );
};
