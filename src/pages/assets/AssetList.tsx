import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getAssets, deleteAsset } from "../../firebase/firestore";
import { Asset } from "../../types";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import { toast } from "react-hot-toast";

const AssetList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      if (currentUser) {
        try {
          const fetchedAssets = await getAssets(currentUser.uid);
          setAssets(fetchedAssets);
        } catch (error) {
          console.error("Error fetching assets:", error);
          toast.error("Failed to fetch assets.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAssets();
  }, [currentUser]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}`);
  };

  const confirmDelete = (asset: Asset) => {
    setAssetToDelete(asset);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      await deleteAsset(assetToDelete.id);
      setAssets(assets.filter((asset) => asset.id !== assetToDelete.id));
      toast.success("Asset deleted successfully.");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset.");
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600">Manage your assets</p>
        </div>
        <Link to="/assets/new">
          <Button variant="primary" icon={<PlusCircle size={18} />}>
            Add Asset
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredAssets.length > 0 ? (
            <div className="space-y-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-lg truncate">
                        {asset.name}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                        {asset.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      <span className="font-medium text-gray-700">Reg:</span>{" "}
                      {asset.registrationNumber}
                    </div>
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {asset.description}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => handleEdit(asset.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => confirmDelete(asset)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center">
              <p className="text-gray-500 mb-4">
                No assets found. Add your first asset to get started.
              </p>
              <Link to="/assets/new">
                <Button variant="primary" icon={<PlusCircle size={18} />}>
                  Add Asset
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
            Are you sure you want to delete the asset "{assetToDelete?.name}"?
            This action cannot be undone.
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
    </div>
  );
};

export default AssetList;
