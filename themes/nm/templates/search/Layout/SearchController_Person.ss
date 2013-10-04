<% if Person %>
	<% with Person %>
		<article itemscope itemtype="http://schema.org/Person">
			<header>
				<p>
					<span itemprop="">
						<% if IsStudent %>
							Student
							<% if IsEmployee %>, <% end_if %>
						<% else %>
							<% if IsAlumni %>
								Alumni
							<% end_if %>
						<% end_if %>
						<% if IsEmployee %>
						<meta itemprop="worksFor" content="Kunsthochschule Kassel">
						<span itemprop="jobTitle">$JobTitle</span>
						<% end_if %>
					</span>

					<% if Image %>
						<% with Image.Images.First %>
							<img itemprop="image" src="$Link" />
						<% end_with %>
					<% end_if %>
				</p>
				<h1 itemprop="name">$FullName</h1>
				<meta itemprop="description" content="$MarkdownedBio.XML">
				<p>$MarkdownedBio</p>
			</header>

			<section>
				<% if Projects %>
					<% include ProjectOverview LinkTo=$UrlSlug %>
				<% end_if %>
				<% if Exhibitions %>
					<% include ProjectOverview Projects=$Exhibitions, LinkTo=$UrlSlug %>
				<% end_if %>
				<% if Excursions %>
					<% include ProjectOverview Projects=$Excursions, LinkTo={$UrlSlug} %>
				<% end_if %>
				<% if Workshops %>
					<% include ProjectOverview Projects=$Workshops, LinkTo=$UrlSlug %>
				<% end_if %>
			</section>
		</article>
	<% end_with %>
<% end_if %>