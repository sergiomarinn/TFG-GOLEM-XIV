import { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Cog6ToothIcon, UserIcon, ShieldCheckIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { UserIcon as UserIconFilled } from '@heroicons/react/24/solid';
import { User } from "@/app/lib/definitions";
import { getAllUsers, updateMyUser, updateMyUserPassword, updateUser } from '@/app/actions/user';
import { getUserFromClient, updateUserFromClient } from '@/app/lib/client-session';
import { Switch } from '@heroui/switch';
import { Avatar } from '@heroui/avatar';
import { addToast } from '@heroui/toast';
import { EyeFilledIcon, EyeSlashFilledIcon } from '@/components/icons';

const validatePassword = (password: string) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Ha de tenir almenys 8 caràcters.');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Ha de contenir almenys una lletra.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Ha de contenir almenys un número.');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Ha de contenir almenys un caràcter especial.');
  }
  
  return errors;
};

export const UserConfigModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
	// Form states
  const [userForm, setUserForm] = useState({
    name: '',
    surnames: '',
    email: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Error states
  const [passwordErrors, setPasswordErrors] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Admin panel states
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUpdateUser, setLoadingUpdateUser] = useState(false);
  const [loadingUpdateUserPassword, setLoadingUpdateUserPassword] = useState(false);
  const [loadingUpdateUserRoles, setLoadingUpdateUserRoles] = useState(false);
  const [loadingUpdateResetUserPassword, setLoadingUpdateResetUserPassword] = useState(false);
	const [isOpenPopoverReset, setIsOpenPopoverReset] = useState(false);
	const [isVisibleCurrentPassword, setIsVisibleCurrentPassword] = useState(false);
	const [isVisibleNewPassword, setIsVisibleNewPassword] = useState(false);
	const [isVisibleNewPasswordRepeat, setIsVisibleNewPasswordRepeat] = useState(false);
	const [newPasswordValidationErrors, setNewPasswordValidationErrors] = useState<string[]>([]);
  const [isNewPasswordTouched, setIsNewPasswordTouched] = useState(false);
  const [isConfirmPasswordTouched, setIsConfirmPasswordTouched] = useState(false);

  // Reset all forms and messages when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setNewPasswordValidationErrors([]);
      setIsNewPasswordTouched(false);
      setIsConfirmPasswordTouched(false);
    } else {
      fetchCurrentUser();
    }
  }, [isOpen]);

	const validateConfirmPassword = () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors(prev => ({
        ...prev,
        confirm_password: 'Les contrasenyes no coincideixen'
      }));
      return false;
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        confirm_password: ''
      }));
      return true;
    }
  };
  
  // Handle new password change
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPasswordForm({...passwordForm, new_password: newPassword});
    setIsNewPasswordTouched(true);
    
    // Validar la nueva contraseña
    const validationErrors = validatePassword(newPassword);
    setNewPasswordValidationErrors(validationErrors);
    
    // Si ya hemos tocado confirm_password, validar que las contraseñas coincidan
    if (isConfirmPasswordTouched) {
      validateConfirmPassword();
    }
  };
  
  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setPasswordForm({...passwordForm, confirm_password: confirmPassword});
    setIsConfirmPasswordTouched(true);
    
    if (passwordForm.new_password !== confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirm_password: 'Les contrasenyes no coincideixen'
      }));
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        confirm_password: ''
      }));
    }
  };
  
  // Fetch current user when modal opens
  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const user = await getUserFromClient();
      setCurrentUser(user);
      setUserForm({
        name: user?.name || "",
        surnames: user?.surnames || "",
        email: user?.email || ""
      });
      setIsAdmin(user?.is_admin || false);
      
      // If user is admin, fetch all users
      if (user?.is_admin) {
        fetchAllUsers();
      }
    } catch (err) {
      addToast({
        title: "No s'ha pogut carregar la informació de l'usuari",
        color: "danger"
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all users for admin panel
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Handle user profile update
  const handleUpdateProfile = async () => {
    try {
			setLoadingUpdateUser(true)
			await updateUserFromClient({
				...currentUser,
        name: userForm.name,
        surnames: userForm.surnames,
        email: userForm.email
      });
      const user = await updateMyUser({
        name: userForm.name,
        surnames: userForm.surnames,
        email: userForm.email
      });
			addToast({
				title: "Perfil actualitzat correctament",
				color: "success"
			})
			setCurrentUser(user);
      setUserForm({
        name: user.name,
        surnames: user.surnames,
        email: user.email
      });
    } catch (err: any) {
			console.error("Error updating user: ", err)
			addToast({
				title: "Error en actualitzar el perfil",
				color: "danger"
			})
    } finally {
			setLoadingUpdateUser(false)
		}
  };
  
  // Handle password change
  const handleUpdatePassword = async () => {
    // Realizar validaciones
    const newPasswordErrors = validatePassword(passwordForm.new_password);
    setNewPasswordValidationErrors(newPasswordErrors);
    
    // Verificar que las contraseñas coincidan
    const passwordsMatch = validateConfirmPassword();
    
    if (newPasswordErrors.length > 0 || !passwordsMatch) {
      return;
    }
    
    // Validar que la nueva contraseña sea diferente a la actual
    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordErrors(prev => ({
        ...prev,
        new_password: 'La nova contrasenya no pot ser igual a l\'actual'
      }));
      return;
    }
    
    try {
      setLoadingUpdateUserPassword(true);
      await updateMyUserPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      addToast({
        title: "Contrasenya actualitzada correctament",
        color: "success"
      });
      
      // Resetear formulario
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordErrors({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setNewPasswordValidationErrors([]);
      setIsNewPasswordTouched(false);
      setIsConfirmPasswordTouched(false);
      
    } catch (err: any) {
      console.error("Error updating user password: ", err);
      
      // Manejar errores específicos de la API
      if (err.message && err.message.includes("Incorrect password")) {
        setPasswordErrors(prev => ({
          ...prev,
          current_password: 'Contrasenya incorrecta'
        }));
      } else if (err.message && err.message.includes("NEW_PASSWORD_SAME_AS_CURRENT_ONE")) {
        setPasswordErrors(prev => ({
          ...prev,
          new_password: 'La nova contrasenya no pot ser igual a l\'actual'
        }));
      } else {
        addToast({
          title: "Error en actualitzar la contrasenya",
          color: "danger",
          timeout: 4000
        });
      }
    } finally {
      setLoadingUpdateUserPassword(false);
    }
  };
  
  // Handle selecting a user in admin panel
  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.niub === userId);
    setSelectedUserData(user || null);
  };
  
  // Handle updating selected user's roles
  const handleUpdateUserRoles = async () => {
    if (!selectedUserData) return;
    
    try {
			setLoadingUpdateUserRoles(true)
      await updateUser(selectedUserData.niub || '', {
				...selectedUserData,
        is_student: selectedUserData.is_student,
        is_teacher: selectedUserData.is_teacher,
        is_admin: selectedUserData.is_admin
      });
			addToast({
				title: "Usuari actualitzat correctament",
				color: "success"
			})
      fetchAllUsers(); // Refresh users list
    } catch (err: any) {
      console.error("Error updating user: ", err)
			addToast({
				title: "Error en actualitzar l'usuari",
				color: "danger",
				timeout: 4000
			})
    } finally {
			setLoadingUpdateUserRoles(false)
		}
  };
  
  // Reset selected user password
  const handleResetUserPassword = async () => {
		if (!selectedUserData || !selectedUserData.niub) return;

    try {
			setLoadingUpdateResetUserPassword(true);
      await updateUser(selectedUserData.niub, {
				...selectedUserData,
        password: "defaultPassword1234"
      });
			setIsOpenPopoverReset(false)
			addToast({
				title: "Contrasenya restablerta correctament",
				color: "success"
			})
    } catch (err: any) {
      console.error("Error reseting user password: ", err)
			addToast({
				title: "Error en restablir la contrasenya",
				color: "danger",
				timeout: 4000
			})
    } finally {
			setLoadingUpdateResetUserPassword(false);
		}
  };
  
  return (
		<Modal 
			isOpen={isOpen} 
			onClose={onClose}
			size="3xl"
			isDismissable={false}
			backdrop="blur"
			scrollBehavior="inside"
		>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<Cog6ToothIcon className="size-6" />
								<span>Configuració d&apos;usuari</span>
							</div>
						</ModalHeader>
						
						<ModalBody>
							{loading ? (
								<div className="flex justify-center py-8">
									<Spinner size="lg" />
								</div>
							) : (
								<Tabs aria-label="Configuration Tabs">
									<Tab key="profile" title={
										<div className="flex items-center gap-2">
											<UserIcon className="size-5" />
											<span>Perfil</span>
										</div>
									}>
										<Card>
											<CardBody className="gap-4">
												<Input
													label="Nom"
													value={userForm.name}
													onChange={(e) => setUserForm({...userForm, name: e.target.value})}
													disabled={loadingUpdateUser}
												/>
												<Input
													label="Cognoms"
													value={userForm.surnames}
													onChange={(e) => setUserForm({...userForm, surnames: e.target.value})}
													disabled={loadingUpdateUser}
												/>
												<Input
													label="Email"
													type="email"
													value={userForm.email}
													onChange={(e) => setUserForm({...userForm, email: e.target.value})}
													disabled={loadingUpdateUser}
												/>
												{/* Display current user roles as non-editable */}
												<div className="mt-2">
													<p className="text-sm font-medium mb-2">Rols de l&apos;usuari</p>
													<div className="flex flex-wrap gap-6">
														<Switch
															size="sm"
															isSelected={currentUser?.is_student} 
															isDisabled
														>
															Estudiant
														</Switch>
														<Switch
															size="sm"
															isSelected={currentUser?.is_teacher} 
															isDisabled
														>
															Professor
														</Switch>
														<Switch
															size="sm"
															isSelected={currentUser?.is_admin} 
															isDisabled
														>
															Admin
														</Switch>
													</div>
												</div>
												<div className="flex justify-end mt-4">
													<Button color="primary" onPress={handleUpdateProfile} isLoading={loadingUpdateUser}>
														Desar canvis
													</Button>
												</div>
											</CardBody>
										</Card>
									</Tab>
									
									<Tab key="password" title={
										<div className="flex items-center gap-2">
											<KeyIcon className="size-5" />
											<span>Contrasenya</span>
										</div>
									}>
										<Card>
											<CardBody className="gap-4">
												<Input
													label="Contrasenya actual"
													type={isVisibleCurrentPassword ? "text" : "password"}
													value={passwordForm.current_password}
													onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
													disabled={loadingUpdateUserPassword}
													isInvalid={!!passwordErrors.current_password}
													errorMessage={passwordErrors.current_password}
													endContent={
														<button
															aria-label="toggle password visibility"
															className="focus:outline-none"
															type="button"
															onClick={() => setIsVisibleCurrentPassword((prev) => !prev)}
														>
															{isVisibleCurrentPassword ? (
																<EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															) : (
																<EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															)}
														</button>
													}
												/>
												<Input
													label="Nova contrasenya"
													type={isVisibleNewPassword ? "text" : "password"}
													value={passwordForm.new_password}
													onChange={handleNewPasswordChange}
													disabled={loadingUpdateUserPassword}
													isInvalid={isNewPasswordTouched && (newPasswordValidationErrors.length > 0 || !!passwordErrors.new_password)}
													errorMessage={passwordErrors.new_password || (newPasswordValidationErrors.length > 0 ? newPasswordValidationErrors.join(' ') : '')}
													endContent={
														<button
															aria-label="toggle password visibility"
															className="focus:outline-none"
															type="button"
															onClick={() => setIsVisibleNewPassword((prev) => !prev)}
														>
															{isVisibleNewPassword ? (
																<EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															) : (
																<EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															)}
														</button>
													}
												/>
												<Input
													label="Confirmar nova contrasenya"
													type={isVisibleNewPasswordRepeat ? "text" : "password"}
													value={passwordForm.confirm_password}
													onChange={handleConfirmPasswordChange}
													disabled={loadingUpdateUserPassword}
													isInvalid={isConfirmPasswordTouched && !!passwordErrors.confirm_password}
													errorMessage={passwordErrors.confirm_password}
													endContent={
														<button
															aria-label="toggle password visibility"
															className="focus:outline-none"
															type="button"
															onClick={() => setIsVisibleNewPasswordRepeat((prev) => !prev)}
														>
															{isVisibleNewPasswordRepeat ? (
																<EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															) : (
																<EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
															)}
														</button>
													}
												/>
												
												<div className="flex justify-end mt-4">
													<Button 
														color="primary" 
														onPress={handleUpdatePassword} 
														isLoading={loadingUpdateUserPassword}
														isDisabled={
															!passwordForm.current_password || 
															!passwordForm.new_password || 
															!passwordForm.confirm_password ||
															newPasswordValidationErrors.length > 0 ||
															!!passwordErrors.confirm_password
														}
													>
														Canviar contrasenya
													</Button>
												</div>
											</CardBody>
										</Card>
									</Tab>
									
									{isAdmin && (
										<Tab key="admin" title={
											<div className="flex items-center gap-2">
												<ShieldCheckIcon className="size-5" />
												<span>Administració</span>
											</div>
										}>
											<Card>
												<CardBody className="gap-4">
													<Select
														items={users}
														label="Seleccionar usuari"
														placeholder="Seleccioni un usuari per editar"
														onChange={(e) => handleSelectUser(e.target.value)}
														selectionMode="single"
														startContent={<UserIconFilled className="size-4"/>}
														isLoading={loadingUsers}
													>
														{users.map((user) => (
															<SelectItem key={user.niub} textValue={user.name + " " + user.surnames}>
																<div className="flex gap-2 items-center">
																	<Avatar alt={user.name} className="flex-shrink-0" size="sm" showFallback name={user.name[0]} />
																	<div className="flex flex-col">
																		<span className="text-small">{user.name + " " + user.surnames}</span>
																		<span className="text-tiny text-default-400">{user.niub} • {user.email}</span>
																	</div>
																</div>
															</SelectItem>
														))}
													</Select>
													
													{selectedUserData && (
														<div className="mt-4 space-y-4">
															<div className="flex flex-col gap-4">
																<div>
																	<p className="text-sm font-medium mb-2">Rols d&apos;usuari</p>
																	<div className="flex flex-wrap gap-6">
																		<Switch
																			size="sm"
																			isSelected={selectedUserData.is_student}
																			onChange={() => setSelectedUserData({
																				...selectedUserData,
																				is_student: !selectedUserData.is_student
																			})}
																			isDisabled={loadingUpdateUserRoles}
																		>
																			Estudiant
																		</Switch>
																		<Switch
																			size="sm"
																			isSelected={selectedUserData.is_teacher}
																			onChange={() => setSelectedUserData({
																				...selectedUserData,
																				is_teacher: !selectedUserData.is_teacher
																			})}
																			isDisabled={loadingUpdateUserRoles}
																		>
																			Professor
																		</Switch>
																		<Switch
																			size="sm"
																			isSelected={selectedUserData.is_admin}
																			onChange={() => setSelectedUserData({
																				...selectedUserData,
																				is_admin: !selectedUserData.is_admin
																			})}
																			isDisabled={loadingUpdateUserRoles}
																		>
																			Administrador
																		</Switch>
																	</div>
																</div>
																
																<div className="flex justify-between mt-4">
																	<Popover placement="top-start" isOpen={isOpenPopoverReset} onOpenChange={(open) => setIsOpenPopoverReset(open)}>
																		<PopoverTrigger>
																			<Button
																				color="warning"
																				variant="flat"
																				isDisabled={!selectedUserData || !selectedUserData.niub}
																				startContent={<ArrowPathIcon className="size-5" />}
																			>
																				Restablir contrasenya
																			</Button>
																		</PopoverTrigger>
																		<PopoverContent>
																			<div className="flex flex-col gap-3 p-2">
																				<p className="text-sm text-default-600">
																					Estàs segur que vols esborrar restablir la contrasenya per <strong>{selectedUserData.name}</strong>?
																				</p>
																				<div className="flex justify-end gap-2">
																					<Button size="sm" variant="light" onPress={() => setIsOpenPopoverReset(false)}>
																						Cancel·lar
																					</Button>
																					<Button
																						size="sm"
																						color="primary"
																						onPress={handleResetUserPassword}
																						isLoading={loadingUpdateResetUserPassword}
																					>
																						Confirmar
																					</Button>
																				</div>
																			</div>
																		</PopoverContent>
																	</Popover>
																	
																	<Button
																		color="primary"
																		onPress={handleUpdateUserRoles}
																		isLoading={loadingUpdateUserRoles}
																	>
																		Desar canvis
																	</Button>
																</div>
															</div>
														</div>
													)}
												</CardBody>
											</Card>
										</Tab>
									)}
								</Tabs>
							)}
						</ModalBody>
						
						<ModalFooter>
							<Button variant="light" onPress={onClose}>
								Tancar
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
  );
};