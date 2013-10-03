<% with Project %>
	<section>
		<header>
			<h1>$Title</h1>
			<% include ProjectHeaderMeta %>
		</header>

		<article>
			$MarkdownedText
		</article>

		<aside>
			<!-- relations -->
			<% if ChildProjects || ParentProjects || Projects %>
				<h3>Projects</h3>
				<ul>
					<% if ChildProjects %>
						<% include ProjectSidebarListItem Projects=$ChildProjects, Person=$Top.Person %>
					<% end_if %>
					<% if ParentProjects %>
						<% include ProjectSidebarListItem Projects=$ParentProjects, Person=$Top.Person %>
					<% end_if %>
					<% if Projects %>
						<% include ProjectSidebarListItem Person=$Top.Person %>
					<% end_if %>
				</ul>
			<% end_if %>
			
			<% if Exhibitions %>
				<h3>Exhibitions</h3>
				<ul>
					<% include ProjectSidebarListItem Projects=$Exhibitions, Person=$Top.Person %>
				</ul>
			<% end_if %>
			<% if Excursions %>
				<h3>Excursions</h3>
				<ul>
					<% include ProjectSidebarListItem Projects=$Excursions, Person=$Top.Person %>
				</ul>
			<% end_if %>
			<% if Workshops %>
				<h3>Workshops</h3>
				<ul>
					<% include ProjectSidebarListItem Projects=$Workshops, Person=$Top.Person %>
				</ul>
			<% end_if %>


			<!-- Contributors -->
			<% if Persons.Count > 3 %>
				<h3>Contributors</h3>
				<ul>
					<% loop Persons %>
						<li><% if not IsExternal %><a href="/about/{$UrlSlug}/"><% end_if %>$FullName<% if not IsExternal %></a><% end_if %></li>
					<% end_loop %>		
				</ul>
			<% end_if %>
		</aside>
	</section>
<% end_with %>