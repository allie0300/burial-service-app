export default function MemberFields({ id, onRemove }) {
  return (
    <div className="member-fields">
      <h4>Family Member</h4>
      <input name={`member-${id}-firstName`} placeholder="First Name" />
      <input name={`member-${id}-surname`} placeholder="Surname" />
      <input name={`member-${id}-idNumber`} placeholder="ID Number" />
      <input 
        type="file" 
        name={`member-${id}-idFile`} 
        accept=".pdf,.jpg,.png" 
      />
      <button 
        type="button" 
        className="remove-member" 
        onClick={() => onRemove(id)}
      >
        Remove
      </button>
    </div>
  );
}