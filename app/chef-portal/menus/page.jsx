"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  PowerOff,
  Power,
  UtensilsCrossed,
  ImagePlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  getMyMenus,
  createMenu,
  updateMenu,
  toggleMenuActive,
  deleteMenu,
  updateMenuImage,
} from "@/services/menu.service";
import { getCategories } from "@/services/category.service";

function MenuForm({ menu, categories, onSubmit, onCancel, isLoading, apiError }) {
  const [fields, setFields] = useState({
    name: menu?.name ?? "",
    description: menu?.description ?? "",
    price: menu?.price?.toString() ?? "",
    category: menu?.category?._id ?? menu?.category ?? "",
    servings: menu?.servings?.toString() ?? "",
    ingredients: Array.isArray(menu?.ingredients) ? menu.ingredients.join(", ") : "",
  });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(menu?.image?.url || null);
  const fileInputRef = useRef(null);

  const set = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!fields.name.trim()) errs.name = "Menu name is required.";
    if (!fields.description.trim()) errs.description = "Description is required.";
    const price = parseFloat(fields.price);
    if (fields.price === "") errs.price = "Price is required.";
    else if (isNaN(price) || price < 0) errs.price = "Price must be a valid non-negative number.";
    if (!fields.category) errs.category = "Category is required.";
    const servings = parseInt(fields.servings, 10);
    if (fields.servings === "") errs.servings = "Servings is required.";
    else if (isNaN(servings) || servings < 1) errs.servings = "Servings must be at least 1.";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(
      {
        name: fields.name.trim(),
        description: fields.description.trim(),
        price: parseFloat(fields.price),
        category: fields.category,
        servings: parseInt(fields.servings, 10),
        ingredients: fields.ingredients
          ? fields.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      },
      imageFile
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const categoryOptions = (categories ?? []).map((c) => ({ value: c._id, label: c.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-1">
      {/* Image — edit only; image is not settable at create time */}
      {menu && (
        <div>
          <label className="block text-sm font-medium mb-2">Menu Image</label>
          <div
            role="button"
            tabIndex={0}
            className="relative w-full h-36 rounded-xl overflow-hidden bg-muted cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Menu preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Click to upload image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                Change image
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional. Image is uploaded when you click Save Changes.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Menu Name <span className="text-red-500">*</span>
        </label>
        <Input
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Sunday Family Feast"
          error={errors.name}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={fields.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe the menu experience..."
          error={errors.description}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Price / person ($) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={fields.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="150"
            error={errors.price}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Servings <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min="1"
            value={fields.servings}
            onChange={(e) => set("servings", e.target.value)}
            placeholder="4"
            error={errors.servings}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <Select
          options={categoryOptions}
          value={fields.category}
          onChange={(val) => set("category", val)}
          placeholder="Select a category"
          error={errors.category}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ingredients</label>
        <Input
          value={fields.ingredients}
          onChange={(e) => set("ingredients", e.target.value)}
          placeholder="chicken, garlic, olive oil, lemon..."
        />
        <p className="text-xs text-muted-foreground mt-1">Separate items with commas.</p>
      </div>

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving…" : menu ? "Save Changes" : "Create Menu"}
        </Button>
      </div>
    </form>
  );
}

function MenuCard({ menu, onEdit, onToggle, onDelete }) {
  const categoryName = menu.category?.name ?? "—";
  const imageUrl = menu.image?.url;

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden flex flex-col sm:flex-row transition-colors hover:border-primary/30">
      <div className="h-48 sm:h-auto sm:w-48 shrink-0 relative bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={menu.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant={menu.isActive ? "success" : "secondary"}>
            {menu.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-base leading-tight pr-4">{menu.name}</h3>
            <div className="text-right shrink-0">
              <span className="font-bold text-accent text-lg">${menu.price}</span>
              <span className="block text-xs text-muted-foreground">/person</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{menu.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="bg-secondary px-2 py-1 rounded-md">{categoryName}</span>
            <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
              <Users className="h-3 w-3" /> {menu.servings} servings
            </span>
          </div>
          {menu.ingredients?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              <span className="font-medium">Ingredients: </span>
              {menu.ingredients.slice(0, 5).join(", ")}
              {menu.ingredients.length > 5 && ` +${menu.ingredients.length - 5} more`}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-4 w-4 mr-1.5" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={
              menu.isActive
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            }
          >
            {menu.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-1.5" /> Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-1.5" /> Activate
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChefMenuManagement() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMenu, setEditMenu] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const { data: menus = [], isLoading, isError } = useQuery({
    queryKey: ["my-menus"],
    queryFn: getMyMenus,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-menus"] });
      setCreateOpen(false);
      setCreateError("");
      toast.success("Menu created successfully.");
    },
    onError: (err) => {
      setCreateError(err.response?.data?.message ?? "Failed to create menu.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-menus"] });
      setEditMenu(null);
      setEditError("");
      toast.success("Menu updated.");
    },
    onError: (err) => {
      setEditError(err.response?.data?.message ?? "Failed to update menu.");
    },
  });

  const imageMutation = useMutation({
    mutationFn: ({ id, file }) => updateMenuImage(id, file),
    onError: (err) => {
      setEditError(err.response?.data?.message ?? "Image upload failed.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => toggleMenuActive(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["my-menus"] });
      setConfirmToggle(null);
      toast.success(updated.isActive ? "Menu activated." : "Menu deactivated.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Failed to update menu status.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-menus"] });
      setConfirmDelete(null);
      toast.success("Menu deleted.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? "Failed to delete menu.");
    },
  });

  const handleCreate = (payload) => {
    setCreateError("");
    createMutation.mutate(payload);
  };

  const handleEdit = async (payload, imageFile) => {
    setEditError("");
    if (imageFile && editMenu) {
      try {
        await imageMutation.mutateAsync({ id: editMenu._id, file: imageFile });
      } catch {
        return; // editError already set by imageMutation.onError
      }
    }
    updateMutation.mutate({ id: editMenu._id, data: payload });
  };

  const isEditLoading = updateMutation.isPending || imageMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage the menus you offer to clients.
          </p>
        </div>
        <Button
          className="shrink-0 flex items-center gap-2"
          onClick={() => {
            setCreateError("");
            setCreateOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Create New Menu
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-2xl bg-card h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-16">
          <p className="text-red-500">Failed to load menus. Please refresh the page.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && menus.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No menus yet</h3>
          <p className="text-muted-foreground mb-6 max-w-xs text-sm">
            You haven't created any menus yet. Create your first menu to start accepting bookings.
          </p>
          <Button
            onClick={() => {
              setCreateError("");
              setCreateOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Your First Menu
          </Button>
        </div>
      )}

      {/* Menu grid */}
      {!isLoading && !isError && menus.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {menus.map((menu) => (
            <MenuCard
              key={menu._id}
              menu={menu}
              onEdit={() => {
                setEditError("");
                setEditMenu(menu);
              }}
              onToggle={() => setConfirmToggle(menu)}
              onDelete={() => setConfirmDelete(menu)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Menu"
        description="Fill in the details below. You can add an image after saving."
        className="max-w-xl"
      >
        <MenuForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createMutation.isPending}
          apiError={createError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editMenu}
        onClose={() => setEditMenu(null)}
        title="Edit Menu"
        description="Update your menu details."
        className="max-w-xl"
      >
        {editMenu && (
          <MenuForm
            key={editMenu._id}
            menu={editMenu}
            categories={categories}
            onSubmit={handleEdit}
            onCancel={() => setEditMenu(null)}
            isLoading={isEditLoading}
            apiError={editError}
          />
        )}
      </Modal>

      {/* Deactivate / Activate confirmation */}
      <Modal
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        title={confirmToggle?.isActive ? "Deactivate this menu?" : "Activate this menu?"}
        description={
          confirmToggle?.isActive
            ? "This menu will no longer be available for new bookings. Existing bookings are not affected."
            : "This menu will become available for new bookings again."
        }
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setConfirmToggle(null)}
            disabled={toggleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={confirmToggle?.isActive ? "danger" : "default"}
            onClick={() => confirmToggle && toggleMutation.mutate(confirmToggle._id)}
            disabled={toggleMutation.isPending}
          >
            {toggleMutation.isPending
              ? "Updating…"
              : confirmToggle?.isActive
              ? "Deactivate"
              : "Activate"}
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this menu?"
        description="This action cannot be undone. The menu will be permanently removed."
      >
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setConfirmDelete(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete._id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete Menu"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
