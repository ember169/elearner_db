ALTER TABLE `goals` ADD `estimated_hours` real;
--> statement-breakpoint
UPDATE `goals` SET `estimated_hours` = CASE `ft_slug`
  WHEN 'libft' THEN 70 WHEN 'ft_printf' THEN 50 WHEN 'get_next_line' THEN 30
  WHEN 'born2beroot' THEN 40 WHEN 'pipex' THEN 30 WHEN 'so_long' THEN 40
  WHEN 'fdf' THEN 40 WHEN 'fract_ol' THEN 50 WHEN 'push_swap' THEN 50
  WHEN 'minitalk' THEN 40 WHEN 'minishell' THEN 120 WHEN 'philosophers' THEN 60
  WHEN 'exam02' THEN 4 WHEN 'netpractice' THEN 15 WHEN 'cub3d' THEN 120
  WHEN 'minirt' THEN 120 WHEN 'cpp00' THEN 15 WHEN 'cpp01' THEN 15
  WHEN 'cpp02' THEN 15 WHEN 'cpp03' THEN 15 WHEN 'cpp04' THEN 10
  WHEN 'cpp05' THEN 15 WHEN 'exam03' THEN 4 WHEN 'cpp06' THEN 15
  WHEN 'cpp07' THEN 10 WHEN 'cpp08' THEN 10 WHEN 'cpp09' THEN 15
  WHEN 'exam04' THEN 4 WHEN 'inception' THEN 50 WHEN 'ft_irc' THEN 80
  WHEN 'webserv' THEN 80 WHEN 'ft_transcendence' THEN 150 WHEN 'exam05' THEN 20
  WHEN 'ft_containers' THEN 100 WHEN 'ft_linear_regression' THEN 40
  WHEN 'ft_ssl_md5' THEN 80 WHEN 'exam06' THEN 4
  ELSE NULL END
WHERE `ft_slug` IS NOT NULL;
