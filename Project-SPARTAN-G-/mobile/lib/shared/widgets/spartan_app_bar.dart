import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class SpartanAppBar extends StatelessWidget implements PreferredSizeWidget {
  const SpartanAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
  });

  final String title;
  final List<Widget>? actions;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      backgroundColor: AppColors.primaryRed,
      foregroundColor: Colors.white,
      actions: actions,
      leading: leading,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
