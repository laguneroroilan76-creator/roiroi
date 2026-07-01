import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'features/dashboard/presentation/dashboard_screen.dart';
import 'features/records/presentation/records_list_screen.dart';

import 'features/vehicles/presentation/vehicle_list_screen.dart';

import 'features/support/presentation/support_list_screen.dart';

final navigationIndexProvider = StateProvider<int>((ref) => 0);

class MainNavigationScreen extends ConsumerWidget {
  const MainNavigationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final index = ref.watch(navigationIndexProvider);

    final screens = [
      const DashboardScreen(),
      const RecordsListScreen(),
      const VehicleListScreen(),
      const SupportListScreen(),
    ];

    return Scaffold(
      drawer: Drawer(
        backgroundColor: const Color(0xFF0A0E14),
        child: Column(
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: Color(0xFF161B22)),
              child: Center(
                child: Text(
                  'HDI MANAGEMENT',
                  style: TextStyle(color: Color(0xFF0066FF), fontWeight: FontWeight.bold, fontSize: 20),
                ),
              ),
            ),
            _buildDrawerItem(context, ref, 'Dashboard', PhosphorIcons.house(), 0),
            _buildDrawerItem(context, ref, 'Records Registry', PhosphorIcons.fileText(), 1),
            _buildDrawerItem(context, ref, 'Vehicle Management', PhosphorIcons.car(), 2),
            _buildDrawerItem(context, ref, 'Support Log', PhosphorIcons.wrench(), 3),
            const Spacer(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Logout', style: TextStyle(color: Colors.redAccent)),
              onTap: () {
                // Handle logout
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: IndexedStack(
        index: index,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (newIndex) => ref.read(navigationIndexProvider.notifier).state = newIndex,
        backgroundColor: const Color(0xFF161B22),
        selectedItemColor: const Color(0xFF0066FF),
        unselectedItemColor: Colors.white24,
        type: BottomNavigationBarType.fixed,
        items: [
          BottomNavigationBarItem(
            icon: Icon(PhosphorIcons.house()),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(PhosphorIcons.fileText()),
            label: 'Records',
          ),
          BottomNavigationBarItem(
            icon: Icon(PhosphorIcons.car()),
            label: 'Fleet',
          ),
          BottomNavigationBarItem(
            icon: Icon(PhosphorIcons.wrench()),
            label: 'Support',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(BuildContext context, WidgetRef ref, String title, IconData icon, int targetIndex) {
    final currentIndex = ref.watch(navigationIndexProvider);
    final isSelected = currentIndex == targetIndex;

    return ListTile(
      leading: Icon(icon, color: isSelected ? const Color(0xFF0066FF) : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.white54,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      onTap: () {
        ref.read(navigationIndexProvider.notifier).state = targetIndex;
        Navigator.pop(context);
      },
    );
  }
}
