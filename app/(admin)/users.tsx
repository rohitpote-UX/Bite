/**
 * Admin Users Screen — User management with add/edit/remove
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { listenToUsers, deactivateUser, updateUser } from '../../src/services/firebase/firestore.service';
import { Avatar } from '../../src/components/ui/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webSafeAlert } from '../../src/utils/alert';
import type { User } from '../../src/types';

export default function UsersScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!userProfile?.officeId) return;
    const unsub = listenToUsers(userProfile.officeId, setUsers);
    return unsub;
  }, [userProfile]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const handleRemoveUser = (user: User) => {
    webSafeAlert(
      'Remove User',
      `Remove ${user.name} from the office?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deactivateUser(user.id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Team Members</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {users.length} active users
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => webSafeAlert('Add User', 'Share your office code with the new user to add them.')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            colors={colors}
            onEdit={() => { setSelectedUser(item); setShowModal(true); }}
            onRemove={() => handleRemoveUser(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            emoji="👥"
            title="No users yet"
            subtitle="Share your office code to add team members"
          />
        }
      />

      {/* Edit User Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Edit User: {selectedUser?.name}
            </Text>
            {selectedUser && (
              <View style={styles.modalContent}>
                <View style={styles.editRow}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Role</Text>
                  <Badge type={selectedUser.role === 'admin' ? 'admin' : 'active'} />
                </View>
                <View style={styles.editRow}>
                  <Text style={[styles.editLabel, { color: colors.textSecondary }]}>Default Meal</Text>
                  <Text style={[styles.editValue, { color: colors.textPrimary }]}>
                    {selectedUser.defaultMealPreference}
                  </Text>
                </View>
              </View>
            )}
            <Button label="Close" onPress={() => setShowModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const UserRow: React.FC<{
  user: User; colors: any;
  onEdit: () => void; onRemove: () => void;
}> = ({ user, colors, onEdit, onRemove }) => (
  <View style={[styles.userRow, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Avatar name={user.name} uri={user.photoURL} size="md" />
    <View style={styles.userInfo}>
      <View style={styles.userNameRow}>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
        {user.role === 'admin' && <Badge type="admin" size="sm" />}
      </View>
      <Text style={[styles.userPhone, { color: colors.textTertiary }]}>{user.phone}</Text>
      <Text style={[styles.userPref, { color: colors.textSecondary }]}>
        Default: {user.defaultMealPreference === 'always-veg' ? '🥦 Veg' :
          user.defaultMealPreference === 'always-non-veg' ? '🍗 Non-Veg' : '🤔 Flexible'}
      </Text>
    </View>
    <View style={styles.userActions}>
      <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
        <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} style={styles.iconBtn}>
        <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.sm,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  subtitle: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body },
  list: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing.sm, paddingBottom: 32 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  userName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  userPhone: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  userPref: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  userActions: { gap: Spacing.xs },
  iconBtn: { padding: Spacing.xs },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  modalTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  modalContent: { gap: Spacing.md },
  editRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.body },
  editValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
});
