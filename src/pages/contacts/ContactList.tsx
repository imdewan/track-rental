import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit,
  Trash2,
  Phone,
  MapPin,
  CreditCard as IdCard,
  StickyNote,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getContacts, deleteContact } from "../../firebase/firestore";
import { Contact } from "../../types";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { toast } from "react-hot-toast";

const ContactList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [contactToViewIdCard, setContactToViewIdCard] =
    useState<Contact | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        try {
          const fetchedContacts = await getContacts(currentUser.uid);
          setContacts(fetchedContacts);
        } catch (error) {
          console.error("Error fetching contacts:", error);
          toast.error("Failed to fetch contacts.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchContacts();
  }, [currentUser]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    navigate(`/contacts/${id}`);
  };

  const confirmDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await deleteContact(contactToDelete.id);
      setContacts(
        contacts.filter((contact) => contact.id !== contactToDelete.id)
      );
      toast.success("Contact deleted successfully.");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact.");
    }
  };

  const getContactInitial = (name: string) => name.charAt(0).toUpperCase();

  const getBadgeColor = (
    index: number
  ):
    | "blue"
    | "green"
    | "purple"
    | "red"
    | "yellow"
    | "orange"
    | "teal"
    | "pink" => {
    const colors = [
      "blue",
      "green",
      "purple",
      "red",
      "yellow",
      "orange",
      "teal",
      "pink",
    ] as const;
    return colors[index % colors.length];
  };

  const handleViewIdCard = (contact: Contact) => {
    setContactToViewIdCard(contact);
    setIsIdCardModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your contacts</p>
        </div>
        <Link to="/contacts/new">
          <Button variant="primary" icon={<PlusCircle size={18} />}>
            Add Contact
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredContacts.length > 0 ? (
            <div className="space-y-4">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-lg shadow-sm border flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Badge
                      color={getBadgeColor(index)}
                      character={getContactInitial(contact.name)}
                      size="md"
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {contact.name}
                      </div>
                      <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone size={15} className="text-gray-400" />
                          <span className="truncate">{contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={15} className="text-gray-400" />
                          <span className="truncate max-w-[180px] sm:max-w-xs">
                            {contact.address}
                          </span>
                        </div>
                        {/* Note Section */}
                        {contact.note && (
                          <div className="flex items-center gap-1 mt-1">
                            <StickyNote size={15} className="text-yellow-500" />
                            <span className="truncate text-gray-700 italic">
                              {contact.note}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<IdCard size={16} />}
                      onClick={() => handleViewIdCard(contact)}
                      className="w-full md:w-auto"
                    >
                      View ID Cards
                    </Button>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => handleEdit(contact.id)}
                        className="w-full md:w-auto"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => confirmDelete(contact)}
                        className="w-full md:w-auto"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-gray-500 mb-4">
                No contacts found. Add your first contact to get started.
              </p>
              <Link to="/contacts/new">
                <Button variant="primary" icon={<PlusCircle size={18} />}>
                  Add Contact
                </Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the contact "{contactToDelete?.name}
            "? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* ID Card Modal */}
      <Modal
        isOpen={isIdCardModalOpen}
        onClose={() => setIsIdCardModalOpen(false)}
        title="ID Card Details"
        size="lg"
      >
        <div
          className="space-y-6 w-full overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {[contactToViewIdCard?.idCard1, contactToViewIdCard?.idCard2].map(
            (idCard, idx) =>
              idCard && (
                <div key={idx} className="w-full">
                  <h3 className="font-semibold mb-2">
                    ID Card {idx + 1}: {idCard.type}
                  </h3>
                  <div className="flex flex-col gap-6 w-full max-w-full">
                    {idCard.front && (
                      <div className="w-full max-w-full">
                        <p className="text-xs text-gray-500 mb-1">Front</p>
                        <img
                          src={idCard.front.url}
                          alt={idCard.front.name}
                          className="w-full max-w-full h-auto rounded border"
                        />
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {idCard.front.name}
                        </p>
                      </div>
                    )}
                    {idCard.back && (
                      <div className="w-full max-w-full">
                        <p className="text-xs text-gray-500 mb-1">Back</p>
                        <img
                          src={idCard.back.url}
                          alt={idCard.back.name}
                          className="w-full max-w-full h-auto rounded border"
                        />
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {idCard.back.name}
                        </p>
                      </div>
                    )}
                    {!idCard.front && !idCard.back && (
                      <p className="text-gray-400 italic">No images uploaded</p>
                    )}
                  </div>
                </div>
              )
          )}
        </div>
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setIsIdCardModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ContactList;
