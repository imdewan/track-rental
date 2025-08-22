import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getRentals,
  deleteRental,
  getAssets,
  getContacts,
} from "../../firebase/firestore";
import { Rental, Asset, Contact } from "../../types";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const RentalList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [assets, setAssets] = useState<Record<string, Asset>>({});
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<Rental | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          // Fetch rentals
          const fetchedRentals = await getRentals(currentUser.uid);
          setRentals(fetchedRentals);

          // Fetch assets and create a map
          const fetchedAssets = await getAssets(currentUser.uid);
          const assetMap: Record<string, Asset> = {};
          fetchedAssets.forEach((asset) => {
            assetMap[asset.id] = asset;
          });
          setAssets(assetMap);

          // Fetch contacts and create a map
          const fetchedContacts = await getContacts(currentUser.uid);
          const contactMap: Record<string, Contact> = {};
          fetchedContacts.forEach((contact) => {
            contactMap[contact.id] = contact;
          });
          setContacts(contactMap);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch rentals.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredRentals = rentals.filter((rental) => {
    const asset = assets[rental.assetId];
    const contact = contacts[rental.contactId];

    const assetName = asset?.name?.toLowerCase() || "";
    const contactName = contact?.name?.toLowerCase() || "";
    const searchLower = searchQuery.toLowerCase();

    return (
      assetName.includes(searchLower) ||
      contactName.includes(searchLower) ||
      rental.status.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (id: string) => {
    navigate(`/rentals/${id}`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/rentals/${id}/details`);
  };

  const confirmDelete = (rental: Rental) => {
    setRentalToDelete(rental);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!rentalToDelete) return;

    try {
      await deleteRental(rentalToDelete.id);
      setRentals(rentals.filter((rental) => rental.id !== rentalToDelete.id));
      toast.success("Rental deleted successfully.");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting rental:", error);
      toast.error("Failed to delete rental.");
    }
  };

  const isOverdue = (date: Date) => {
    return new Date() > new Date(date);
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
          <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
          <p className="text-gray-600">Manage your rentals</p>
        </div>
        <Link to="/rentals/new">
          <Button variant="primary" icon={<PlusCircle size={18} />}>
            Add Rental
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Search rentals..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredRentals.length > 0 ? (
            <div className="space-y-4">
              {filteredRentals.map((rental) => {
                const asset = assets[rental.assetId];
                const contact = contacts[rental.contactId];
                const isPaymentOverdue = isOverdue(rental.nextPaymentDate);

                return (
                  <div
                    key={rental.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-300 flex flex-col md:flex-row md:items-center justify-between px-4 py-4 transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Badge
                        color={rental.badgeColor}
                        character={rental.badgeCharacter}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {asset?.name || "Unknown Asset"}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {contact?.name || "Unknown Contact"}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="flex items-center text-xs text-gray-700 bg-gray-100 rounded px-2 py-0.5">
                            <DollarSign
                              size={14}
                              className="mr-1 text-gray-400"
                            />
                            ₹{rental.rate.toLocaleString()} / {rental.rateType}
                          </span>
                          <span className="flex items-center text-xs text-gray-700 bg-gray-100 rounded px-2 py-0.5">
                            <Calendar
                              size={14}
                              className="mr-1 text-gray-400"
                            />
                            <span
                              className={
                                isPaymentOverdue
                                  ? "text-red-600 font-medium"
                                  : "text-gray-900"
                              }
                            >
                              {format(rental.nextPaymentDate, "MMM dd, yyyy")}
                              {isPaymentOverdue && " (Overdue)"}
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rental.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {rental.status === "active" ? "Active" : "Ended"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex mt-4 md:mt-0 md:ml-4 gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<ExternalLink size={16} />}
                        onClick={() => handleViewDetails(rental.id)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => handleEdit(rental.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => confirmDelete(rental)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-gray-500 mb-4">
                No rentals found. Add your first rental to get started.
              </p>
              <Link to="/rentals/new">
                <Button variant="primary" icon={<PlusCircle size={18} />}>
                  Add Rental
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
            Are you sure you want to delete this rental? This action cannot be
            undone.
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
      <div className="h-8" />
    </div>
  );
};

export default RentalList;
